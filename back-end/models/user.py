from datetime import datetime
from bson import ObjectId
import bcrypt
from config.database import db_instance

class User:
    @staticmethod
    def _get_collection():
        """Get users collection with None check"""
        if db_instance is not None and db_instance.users is not None:
            return db_instance.users
        raise ConnectionError("Database not connected")
    
    @staticmethod
    def create(email, password, display_name=None):
        """Create a new user"""
        # Hash password with higher cost factor for better security
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt(rounds=12))
        
        user_data = {
            "email": email,
            "password": hashed_password,
            "display_name": display_name or email.split('@')[0],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "is_online": False,
            "last_seen": None,
            "email_verified": False,
            "verification_token": None,
            "failed_login_attempts": 0,
            "account_locked_until": None,
            "refresh_token": None,
            "refresh_token_expires": None
        }
        
        result = User._get_collection().insert_one(user_data)
        user_data['_id'] = str(result.inserted_id)
        user_data.pop('password')  # Don't return password
        return user_data
    
    @staticmethod
    def find_by_email(email):
        """Find user by email"""
        return User._get_collection().find_one({"email": email})
    
    @staticmethod
    def find_by_id(user_id):
        """Find user by ID"""
        try:
            user = User._get_collection().find_one({"_id": ObjectId(user_id)})
            if user:
                user['_id'] = str(user['_id'])
                user.pop('password', None)
            return user
        except:
            return None
    
    @staticmethod
    def verify_password(email, password):
        """Verify user password"""
        user = User.find_by_email(email)
        if user and bcrypt.checkpw(password.encode('utf-8'), user['password']):
            user['_id'] = str(user['_id'])
            user.pop('password')
            return user
        return None
    
    @staticmethod
    def update_online_status(user_id, is_online):
        """Update user online status"""
        User._get_collection().update_one(
            {"_id": ObjectId(user_id)},
            {
                "$set": {
                    "is_online": is_online,
                    "last_seen": datetime.utcnow() if not is_online else None
                }
            }
        )
    
    @staticmethod
    def get_online_users():
        """Get all online users"""
        users = User._get_collection().find({"is_online": True}, {"password": 0})
        result = []
        for u in users:
            user_dict = {"id": str(u['_id'])}
            for k, v in u.items():
                if k != '_id':
                    # Convert datetime objects to ISO format strings
                    if isinstance(v, datetime):
                        user_dict[k] = v.isoformat() if v else None
                    else:
                        user_dict[k] = v
            result.append(user_dict)
        return result
    
    @staticmethod
    def increment_failed_login(email):
        """Increment failed login attempts"""
        from datetime import timedelta
        user = User.find_by_email(email)
        if user:
            attempts = user.get('failed_login_attempts', 0) + 1
            update_data = {"failed_login_attempts": attempts}
            
            # Lock account after 5 failed attempts for 15 minutes
            if attempts >= 5:
                update_data["account_locked_until"] = datetime.utcnow() + timedelta(minutes=15)
            
            User._get_collection().update_one(
                {"_id": user['_id']},
                {"$set": update_data}
            )
    
    @staticmethod
    def reset_failed_login(email):
        """Reset failed login attempts"""
        User._get_collection().update_one(
            {"email": email},
            {"$set": {"failed_login_attempts": 0, "account_locked_until": None}}
        )
    
    @staticmethod
    def is_account_locked(email):
        """Check if account is locked"""
        user = User.find_by_email(email)
        if user and user.get('account_locked_until'):
            if user['account_locked_until'] > datetime.utcnow():
                return True
            else:
                # Unlock account if time has passed
                User.reset_failed_login(email)
        return False
    
    @staticmethod
    def update_refresh_token(user_id, token, expires):
        """Update refresh token"""
        User._get_collection().update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"refresh_token": token, "refresh_token_expires": expires}}
        )
    
    @staticmethod
    def verify_refresh_token(user_id, token):
        """Verify refresh token"""
        user = User.find_by_id(user_id)
        if user and user.get('refresh_token') == token:
            if user.get('refresh_token_expires') and user['refresh_token_expires'] > datetime.utcnow():
                return True
        return False    
    @staticmethod
    def update_password(email, new_password):
        """Update user password"""
        # Hash the new password
        hashed_password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt(rounds=12))
        
        # Update password in database
        result = User._get_collection().update_one(
            {"email": email},
            {
                "$set": {
                    "password": hashed_password,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        return result.modified_count > 0