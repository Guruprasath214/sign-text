import os
from dotenv import load_dotenv
from config.database import db_instance, db

load_dotenv()

def test_connection():
    """Test MongoDB connection"""
    print("🔍 Testing MongoDB Atlas Connection...")
    print(f"📍 Database: {os.getenv('DB_NAME')}")
    
    try:
        # Use the singleton instance
        database = db
        
        # Try to list collections
        collections = database.list_collection_names()
        print(f"✅ Connected successfully!")
        print(f"📋 Existing collections: {collections if collections else 'None (database is new)'}")
        
        # Count documents in collections
        if 'users' in collections:
            user_count = database.users.count_documents({})
            print(f"👤 Users in database: {user_count}")
            
        if 'call_history' in collections:
            call_count = database.call_history.count_documents({})
            print(f"📞 Calls in history: {call_count}")
        
        # Test a simple operation
        result = database.command('ping')
        print(f"🏓 Ping successful: {result.get('ok') == 1}")
        
        return True
        
    except Exception as e:
        print(f"❌ Connection failed: {str(e)}")
        return False

if __name__ == "__main__":
    success = test_connection()
    if success:
        print("\n🎉 Your MongoDB Atlas is ready to use!")
        print("📝 Next step: Start the backend server with 'python api_server.py'")
    else:
        print("\n⚠️ Please check your connection string and credentials")