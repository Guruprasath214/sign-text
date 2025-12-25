import os
import secrets
from datetime import datetime, timedelta
from itsdangerous import URLSafeTimedSerializer
from dotenv import load_dotenv

load_dotenv()

def generate_csrf_token():
    """Generate CSRF token"""
    return secrets.token_hex(32)

def verify_csrf_token(token, session_token):
    """Verify CSRF token"""
    return token == session_token

def generate_verification_token(email):
    """Generate email verification token"""
    serializer = URLSafeTimedSerializer(os.getenv('SECRET_KEY'))
    return serializer.dumps(email, salt=os.getenv('CSRF_SECRET'))

def verify_verification_token(token, max_age=3600):
    """Verify email verification token (1 hour expiry)"""
    serializer = URLSafeTimedSerializer(os.getenv('SECRET_KEY'))
    try:
        email = serializer.loads(token, salt=os.getenv('CSRF_SECRET'), max_age=max_age)
        return email
    except:
        return None

def generate_secure_random_string(length=32):
    """Generate a cryptographically secure random string"""
    return secrets.token_urlsafe(length)

def is_safe_url(url, allowed_hosts):
    """Check if URL is safe for redirect"""
    from urllib.parse import urlparse
    
    if not url:
        return False
    
    parsed = urlparse(url)
    
    # Must be relative or from allowed host
    if parsed.netloc and parsed.netloc not in allowed_hosts:
        return False
    
    return True
