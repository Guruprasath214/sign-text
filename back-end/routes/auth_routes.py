from flask import Blueprint, request, jsonify, make_response
from models.user import User
from utils.auth import generate_token_pair, set_auth_cookies, clear_auth_cookies, decode_token, token_required
from utils.validation import validate_email_format, validate_password_strength, sanitize_input, validate_display_name
from datetime import datetime, timedelta

auth_bp = Blueprint('auth', __name__)

# CSRF token endpoint removed - not needed with HTTPOnly cookies

@auth_bp.route('/signup', methods=['POST'])
def signup():
    """User registration with enhanced security"""
    try:
        data = request.get_json()
        
        # Sanitize inputs
        email = sanitize_input(data.get('email', ''))
        password = data.get('password', '')
        display_name = sanitize_input(data.get('display_name', ''))
        
        # Validate email
        is_valid_email, email_result = validate_email_format(email)
        if not is_valid_email:
            return jsonify({'error': f'Invalid email: {email_result}'}), 400
        email = email_result  # Use normalized email
        
        # Validate password strength
        is_strong, password_errors = validate_password_strength(password)
        if not is_strong:
            return jsonify({'error': 'Weak password', 'details': password_errors}), 400
        
        # Validate display name if provided
        if display_name:
            is_valid_name, name_error = validate_display_name(display_name)
            if not is_valid_name:
                return jsonify({'error': name_error}), 400
        
        # Check if user already exists
        existing_user = User.find_by_email(email)
        if existing_user:
            return jsonify({'error': 'User already exists'}), 400
        
        # Create user
        user = User.create(email, password, display_name)
        
        # Generate token pair
        access_token, refresh_token = generate_token_pair(user['_id'], user['email'])
        
        # Store refresh token in database
        User.update_refresh_token(
            user['_id'],
            refresh_token,
            datetime.utcnow() + timedelta(days=30)
        )
        
        # Create response with HTTPOnly cookies
        response = make_response(jsonify({
            'message': 'User created successfully',
            'user': user
        }), 201)
        
        response = set_auth_cookies(response, access_token, refresh_token)
        
        return response
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """User login with account lockout protection"""
    try:
        data = request.get_json()
        
        # Sanitize inputs
        email = sanitize_input(data.get('email', ''))
        password = data.get('password', '')
        
        if not email or not password:
            return jsonify({'error': 'Email and password are required'}), 400
        
        # Check if account is locked
        if User.is_account_locked(email):
            return jsonify({'error': 'Account is temporarily locked due to too many failed login attempts. Please try again later.'}), 423
        
        # Verify credentials
        user = User.verify_password(email, password)
        if not user:
            # Increment failed login attempts
            User.increment_failed_login(email)
            return jsonify({'error': 'Invalid email or password'}), 401
        
        # Reset failed login attempts on successful login
        User.reset_failed_login(email)
        
        # Generate token pair
        access_token, refresh_token = generate_token_pair(user['_id'], user['email'])
        
        # Store refresh token in database
        User.update_refresh_token(
            user['_id'],
            refresh_token,
            datetime.utcnow() + timedelta(days=30)
        )
        
        # Create response with HTTPOnly cookies
        response = make_response(jsonify({
            'message': 'Login successful',
            'user': user
        }), 200)
        
        response = set_auth_cookies(response, access_token, refresh_token)
        
        return response
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/refresh', methods=['POST'])
def refresh():
    """Refresh access token using refresh token"""
    try:
        # Get refresh token from cookie
        refresh_token = request.cookies.get('refresh_token')
        
        if not refresh_token:
            return jsonify({'error': 'Refresh token missing'}), 401
        
        # Decode refresh token
        payload = decode_token(refresh_token, 'refresh')
        if not payload:
            return jsonify({'error': 'Invalid refresh token'}), 401
        
        # Verify refresh token in database
        if not User.verify_refresh_token(payload['user_id'], refresh_token):
            return jsonify({'error': 'Refresh token not found or expired'}), 401
        
        # Generate new access token
        from utils.auth import generate_token
        new_access_token = generate_token(payload['user_id'], payload['email'], 'access')
        
        # Create response
        response = make_response(jsonify({'message': 'Token refreshed'}), 200)
        
        # Set new access token cookie
        response.set_cookie(
            'access_token',
            value=new_access_token,
            httponly=True,
            secure=False,  # Set to True in production with HTTPS
            samesite='Lax',
            max_age=3600
        )
        
        return response
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/logout', methods=['POST'])
@token_required
def logout():
    """User logout - clear tokens"""
    try:
        # Clear refresh token from database
        User.update_refresh_token(request.user_id, None, None)
        
        # Create response and clear cookies
        response = make_response(jsonify({'message': 'Logout successful'}), 200)
        response = clear_auth_cookies(response)
        
        return response
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/me', methods=['GET'])
@token_required
def get_current_user():
    """Get current user info (requires token)"""
    try:
        user = User.find_by_id(request.user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        return jsonify({'user': user}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    """Reset user password"""
    try:
        data = request.get_json()
        
        email = sanitize_input(data.get('email', ''))
        new_password = data.get('new_password', '')
        
        if not email or not new_password:
            return jsonify({'error': 'Email and new password are required'}), 400
        
        # Validate password strength
        is_strong, password_errors = validate_password_strength(new_password)
        if not is_strong:
            return jsonify({'error': 'Weak password', 'details': password_errors}), 400
        
        # Check if user exists
        user = User.find_by_email(email)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Update password
        success = User.update_password(email, new_password)
        
        if success:
            return jsonify({'message': 'Password updated successfully'}), 200
        else:
            return jsonify({'error': 'Failed to update password'}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500
