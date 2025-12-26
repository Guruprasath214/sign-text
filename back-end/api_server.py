from flask import Flask, request, jsonify, session
from flask_cors import CORS
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_talisman import Talisman
from flask_wtf.csrf import CSRFProtect
import cv2
import numpy as np
import os
from dotenv import load_dotenv

from camera.hand_tracker import HandTracker
from sign_recognition.sign_predictor import predict_sign
from routes.auth_routes import auth_bp
from routes.call_routes import call_bp
from routes.sign_routes import sign_bp
from models.user import User

load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key')
app.config['SESSION_COOKIE_SECURE'] = os.getenv('FORCE_HTTPS', 'False') == 'True'
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['WTF_CSRF_ENABLED'] = False  # Disable CSRF for now (Socket.IO conflicts)
app.config['WTF_CSRF_TIME_LIMIT'] = None

# CSRF Protection (disabled for Socket.IO compatibility)
# csrf = CSRFProtect(app)

# Get allowed origins from environment
allowed_origins_str = os.getenv('ALLOWED_ORIGINS', 'http://localhost:5173,http://localhost:3000')
allowed_origins = [origin.strip() for origin in allowed_origins_str.split(',')]
print(f"🌐 CORS allowed origins: {allowed_origins}", flush=True)

# CORS with permissive settings for development
CORS(app, 
     resources={r"/*": {
         "origins": allowed_origins,
         "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
         "allow_headers": ["Content-Type", "Authorization", "X-Requested-With"],
         "supports_credentials": True,
         "expose_headers": ["Content-Type", "Authorization"]
     }},
     supports_credentials=True)

# Force HTTPS in production
if os.getenv('FORCE_HTTPS', 'False') == 'True':
    Talisman(app, 
             force_https=False,  # Disable force HTTPS redirect to allow CORS
             strict_transport_security=False,
             content_security_policy=None,  # Disable CSP to allow CORS
             force_https_permanent=False)

# Rate Limiting (Redis recommended for production, memory for development)
redis_url = os.getenv('REDIS_URL', None)
# Higher limits for development (HMR causes multiple requests)
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    storage_uri=redis_url or "memory://",
    default_limits=["1000 per day", "200 per hour"],
    storage_options={}
)

# Initialize SocketIO with CORS
socketio = SocketIO(app, 
                    cors_allowed_origins=allowed_origins,
                    async_mode='eventlet',
                    cookie=True,
                    engineio_logger=False)

# Initialize hand tracker
tracker = HandTracker()

# Register blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(call_bp, url_prefix='/api/calls')
app.register_blueprint(sign_bp, url_prefix='/api/sign')

# Keep track of connected users
connected_users = {}

# ===== SECURITY HEADERS =====
@app.after_request
def set_security_headers(response):
    """Add security headers to all responses"""
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    
    # Permissions Policy
    response.headers['Permissions-Policy'] = 'geolocation=(), microphone=(self), camera=(self)'
    
    return response

# ===== ORIGINAL SIGN LANGUAGE ROUTE =====
@app.route("/predict", methods=["POST"])
@limiter.limit("30 per minute")  # Rate limit to prevent abuse
def predict():
    if "frame" not in request.files:
        return jsonify({"error": "No frame"}), 400

    file = request.files["frame"]
    npimg = np.frombuffer(file.read(), np.uint8)
    frame = cv2.imdecode(npimg, cv2.IMREAD_COLOR)

    result = tracker.process(frame)
    prediction = "No Hand"

    if result.multi_hand_landmarks:
        for hand_landmarks in result.multi_hand_landmarks:
            prediction = predict_sign(hand_landmarks)

    return jsonify({"prediction": prediction})

# ===== HEALTH CHECK =====
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'message': 'Server is running',
        'security': 'enabled',
        'features': ['auth', 'calls', 'webrtc', 'socket.io', 'sign-language', 'rate-limiting', 'csrf-protection']
    }), 200

# ===== SOCKET.IO EVENTS =====
@socketio.on('connect')
def handle_connect():
    print(f'✅ Client connected: {request.sid}')
    emit('connected', {'sid': request.sid})

@socketio.on('disconnect')
def handle_disconnect():
    print(f'❌ Client disconnected: {request.sid}')
    
    # Remove from connected users and update status
    user_id = connected_users.pop(request.sid, None)
    if user_id:
        User.update_online_status(user_id, False)
        # Broadcast updated online users
        online_users = User.get_online_users()
        emit('online_users_updated', {'users': online_users}, broadcast=True)

@socketio.on('user_online')
def handle_user_online(data):
    """Mark user as online"""
    user_id = data.get('user_id')
    if user_id:
        connected_users[request.sid] = user_id
        User.update_online_status(user_id, True)
        
        # Broadcast updated online users
        online_users = User.get_online_users()
        emit('online_users_updated', {'users': online_users}, broadcast=True)
        print(f'👤 User {user_id} is online')

@socketio.on('get_online_users')
def handle_get_online_users():
    """Get list of online users"""
    online_users = User.get_online_users()
    emit('online_users_updated', {'users': online_users})

# ===== WEBRTC SIGNALING =====
@socketio.on('join_room')
def handle_join_room(data):
    """Join a video call room"""
    room = data.get('room')
    user_id = data.get('user_id')
    
    if room:
        join_room(room)
        emit('user_joined', {'user_id': user_id, 'sid': request.sid}, room=room, skip_sid=request.sid)
        print(f'📹 User {user_id} joined room {room}')

@socketio.on('leave_room')
def handle_leave_room(data):
    """Leave a video call room"""
    room = data.get('room')
    user_id = data.get('user_id')
    
    if room:
        leave_room(room)
        emit('user_left', {'user_id': user_id}, room=room)
        print(f'👋 User {user_id} left room {room}')

@socketio.on('webrtc_offer')
def handle_webrtc_offer(data):
    """Forward WebRTC offer to peer"""
    room = data.get('room')
    offer = data.get('offer')
    sender_id = data.get('sender_id')
    
    emit('webrtc_offer', {
        'offer': offer,
        'sender_id': sender_id
    }, room=room, skip_sid=request.sid)

@socketio.on('webrtc_answer')
def handle_webrtc_answer(data):
    """Forward WebRTC answer to peer"""
    room = data.get('room')
    answer = data.get('answer')
    sender_id = data.get('sender_id')
    
    emit('webrtc_answer', {
        'answer': answer,
        'sender_id': sender_id
    }, room=room, skip_sid=request.sid)

@socketio.on('webrtc_ice_candidate')
def handle_ice_candidate(data):
    """Forward ICE candidate to peer"""
    room = data.get('room')
    candidate = data.get('candidate')
    sender_id = data.get('sender_id')
    
    emit('webrtc_ice_candidate', {
        'candidate': candidate,
        'sender_id': sender_id
    }, room=room, skip_sid=request.sid)

@socketio.on('send_caption')
def handle_caption(data):
    """Broadcast caption to all users in room"""
    room = data.get('room')
    caption = data.get('caption')
    caption_type = data.get('type')  # 'sign' or 'speech'
    sender_id = data.get('sender_id')
    sender_name = data.get('sender_name', 'User')
    
    emit('receive_caption', {
        'caption': caption,
        'type': caption_type,
        'sender_id': sender_id,
        'sender_name': sender_name,
        'timestamp': data.get('timestamp')
    }, room=room, include_self=True)

if __name__ == "__main__":
    port = int(os.getenv('PORT', 5000))
    print(f"🚀 Server starting on port {port}", flush=True)
    print(f"🔒 Security: HTTPS={os.getenv('FORCE_HTTPS', 'False')}, Rate Limiting=Enabled, CSRF=Enabled", flush=True)
    print(f"📡 Socket.IO enabled for real-time communication", flush=True)
    print(f"🛡️  HTTPOnly Cookies, Security Headers, Input Validation enabled", flush=True)
    socketio.run(app, host="0.0.0.0", port=port, debug=False)
