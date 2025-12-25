from flask import Blueprint, request, jsonify
from flask_socketio import emit
import cv2
import numpy as np
import base64
from camera.hand_tracker import HandTracker
from sign_recognition.sign_predictor import predict_sign

sign_bp = Blueprint('sign', __name__)

# Initialize hand tracker
tracker = HandTracker()

@sign_bp.route('/detect', methods=['POST'])
def detect_sign():
    """
    Detect sign language from video frame
    Expects: { "frame": "base64_encoded_image", "room_id": "room123", "user_id": "user123" }
    Returns: { "sign": "HELLO", "confidence": 0.95 }
    """
    try:
        data = request.get_json()
        
        # Decode base64 image
        frame_data = data.get('frame', '')
        if not frame_data:
            return jsonify({'error': 'No frame data provided'}), 400
        
        # Remove data URL prefix if present
        if 'base64,' in frame_data:
            frame_data = frame_data.split('base64,')[1]
        
        # Decode base64 to image
        img_bytes = base64.b64decode(frame_data)
        nparr = np.frombuffer(img_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if frame is None:
            return jsonify({'error': 'Invalid frame data'}), 400
        
        # Process frame with hand tracker
        result = tracker.process(frame)
        
        if result.multi_hand_landmarks:
            # Get first hand detected
            hand_landmarks = result.multi_hand_landmarks[0]
            
            # Predict sign
            detected_sign = predict_sign(hand_landmarks)
            
            return jsonify({
                'sign': detected_sign,
                'detected': True,
                'timestamp': data.get('timestamp', None)
            })
        else:
            return jsonify({
                'sign': None,
                'detected': False,
                'message': 'No hand detected'
            })
    
    except Exception as e:
        print(f"Error in sign detection: {str(e)}")
        return jsonify({'error': str(e)}), 500
