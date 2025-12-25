import re
from email_validator import validate_email, EmailNotValidError

def validate_email_format(email):
    """Validate email format"""
    try:
        # Validate and normalize email
        valid = validate_email(email, check_deliverability=False)
        return True, valid.email
    except EmailNotValidError as e:
        return False, str(e)

def validate_password_strength(password):
    """Validate password strength"""
    errors = []
    
    if len(password) < 8:
        errors.append("Password must be at least 8 characters long")
    
    if not re.search(r'[A-Z]', password):
        errors.append("Password must contain at least one uppercase letter")
    
    if not re.search(r'[a-z]', password):
        errors.append("Password must contain at least one lowercase letter")
    
    if not re.search(r'[0-9]', password):
        errors.append("Password must contain at least one number")
    
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        errors.append("Password must contain at least one special character")
    
    return len(errors) == 0, errors

def sanitize_input(text):
    """Sanitize user input to prevent injection"""
    if not isinstance(text, str):
        return text
    
    # Remove potential malicious characters
    sanitized = text.strip()
    
    # Remove null bytes
    sanitized = sanitized.replace('\x00', '')
    
    return sanitized

def validate_display_name(name):
    """Validate display name"""
    if not name or len(name) < 2:
        return False, "Display name must be at least 2 characters"
    
    if len(name) > 50:
        return False, "Display name must be less than 50 characters"
    
    # Allow letters, numbers, spaces, and basic punctuation
    if not re.match(r'^[a-zA-Z0-9\s\-_.]+$', name):
        return False, "Display name contains invalid characters"
    
    return True, None
