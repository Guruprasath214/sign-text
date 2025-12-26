import os
import certifi
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

class Database:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(Database, cls).__new__(cls)
            cls._instance._initialize()
        return cls._instance
    
    def _initialize(self):
        try:
            # Use certifi for SSL certificates - compatible with Python 3.13
            self.client = MongoClient(
                os.getenv('MONGODB_URI'),
                tlsCAFile=certifi.where(),
                serverSelectionTimeoutMS=5000
            )
            self.db = self.client[os.getenv('DB_NAME', 'deaf_dump_db')]
            
            # Test connection
            self.client.admin.command('ping')
            print("✅ MongoDB connection successful!")
            
            # Initialize collections
            self.users = self.db.users
            self.call_history = self.db.call_history
            self.online_users = self.db.online_users
            
            # Create indexes
            self.users.create_index("email", unique=True)
            self.call_history.create_index("user_id")
            self.online_users.create_index("user_id")
            
        except Exception as e:
            print(f"❌ MongoDB connection failed: {e}")
            print(f"💡 Troubleshooting tips:")
            print(f"   1. Check if your MongoDB URI is correct in .env file")
            print(f"   2. Verify your network connection")
            print(f"   3. Try: pip install --upgrade certifi")
            print(f"   4. Check if MongoDB Atlas IP whitelist includes your IP")
            # Don't raise - allow server to start even if DB fails
            self.client = None
            self.db = None
            self.users = None
            self.call_history = None
            self.online_users = None
    
    def get_db(self):
        return self.db
    
    def close(self):
        if self.client:
            self.client.close()

# Singleton instance
db_instance = Database()

# Provide property-based access to collections
@property
def users():
    return db_instance.users if db_instance else None

@property  
def call_history():
    return db_instance.call_history if db_instance else None

@property
def online_users():
    return db_instance.online_users if db_instance else None

# Keep backward compatibility
db = db_instance.get_db()
