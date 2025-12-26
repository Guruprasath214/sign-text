import os
import jwt
from datetime import datetime, timedelta
from functools import wraps
from flask import request, jsonify, make_response
from dotenv import load_dotenv

load_dotenv()

JWT_SECRET = os.getenv('JWT_SECRET', 'your-secret-key-change-this')
JWT_REFRESH_SECRET = os.getenv('JWT_REFRESH_SECRET', 'your-refresh-secret-change-this')
JWT_ALGORITHM = 'HS256'
ACCESS_TOKEN_EXPIRY = timedelta(hours=1)  # Short-lived access token
REFRESH_TOKEN_EXPIRY = timedelta(days=30)  # Long-lived refresh token

def generate_token(user_id, email, token_type='access'):
    """Generate JWT token (access or refresh)"""
    secret = JWT_SECRET if token_type == 'access' else JWT_REFRESH_SECRET
    expiry = ACCESS_TOKEN_EXPIRY if token_type == 'access' else REFRESH_TOKEN_EXPIRY
    
    payload = {
        'user_id': user_id,
        'email': email,
        'type': token_type,
        'exp': datetime.utcnow() + expiry,
        'iat': datetime.utcnow()
    }
    return jwt.encode(payload, secret, algorithm=JWT_ALGORITHM)

def generate_token_pair(user_id, email):
    """Generate access and refresh token pair"""
    access_token = generate_token(user_id, email, 'access')
    refresh_token = generate_token(user_id, email, 'refresh')
    return access_token, refresh_token

def decode_token(token, token_type='access'):
    """Decode JWT token"""
    secret = JWT_SECRET if token_type == 'access' else JWT_REFRESH_SECRET
    
    try:
        payload = jwt.decode(token, secret, algorithms=[JWT_ALGORITHM])
        
        # Verify token type
        if payload.get('type') != token_type:
            return None
        
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def set_auth_cookies(response, access_token, refresh_token):
    """Set HTTPOnly cookies for tokens"""
    # Access token cookie (1 hour)
    response.set_cookie(
        'access_token',
        value=access_token,
        httponly=True,
        secure=True,  # Required for SameSite=None
        samesite='None',  # Allow cross-origin cookies (Vercel → Render)
        max_age=3600  # 1 hour
    )
    
    # Refresh token cookie (30 days)
    response.set_cookie(
        'refresh_token',
        value=refresh_token,
        httponly=True,
        secure=True,  # Required for SameSite=None
        samesite='None',  # Allow cross-origin cookies (Vercel → Render)
        max_age=2592000  # 30 days
    )
    
    return response

def clear_auth_cookies(response):
    """Clear authentication cookies"""
    response.set_cookie('access_token', '', expires=0)
    response.set_cookie('refresh_token', '', expires=0)
    return response

def token_required(f):
    """Decorator to protect routes with JWT"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Try to get token from cookie first (more secure)
        if 'access_token' in request.cookies:
            token = request.cookies.get('access_token')
        # Fallback to Authorization header for API clients
        elif 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(' ')[1]  # Bearer <token>
            except IndexError:
                return jsonify({'error': 'Invalid token format'}), 401
        
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        
        # Decode token
        payload = decode_token(token, 'access')
        if not payload:
            return jsonify({'error': 'Token is invalid or expired'}), 401
        
        # Add user info to request
        request.user_id = payload['user_id']
        request.user_email = payload['email']
        
        return f(*args, **kwargs)
    
    return decorated
