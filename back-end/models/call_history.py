from datetime import datetime
from bson import ObjectId
from config.database import db_instance

class CallHistory:
    @staticmethod
    def _get_collection():
        """Get call_history collection with None check"""
        if db_instance is not None and db_instance.call_history is not None:
            return db_instance.call_history
        raise ConnectionError("Database not connected")
    
    @staticmethod
    def create_call(caller_id, receiver_id, call_type="video"):
        """Create a new call record"""
        call_data = {
            "caller_id": caller_id,
            "receiver_id": receiver_id,
            "call_type": call_type,  # "video" or "audio"
            "status": "initiated",  # initiated, ongoing, completed, missed
            "started_at": datetime.utcnow(),
            "ended_at": None,
            "duration": 0,  # in seconds
            "created_at": datetime.utcnow()
        }
        
        result = CallHistory._get_collection().insert_one(call_data)
        call_data['_id'] = str(result.inserted_id)
        return call_data
    
    @staticmethod
    def update_call_status(call_id, status, ended_at=None):
        """Update call status"""
        update_data = {"status": status}
        
        if ended_at:
            update_data["ended_at"] = ended_at
            call = CallHistory._get_collection().find_one({"_id": ObjectId(call_id)})
            if call and call.get('started_at'):
                duration = (ended_at - call['started_at']).total_seconds()
                update_data["duration"] = int(duration)
        
        CallHistory._get_collection().update_one(
            {"_id": ObjectId(call_id)},
            {"$set": update_data}
        )
    
    @staticmethod
    def get_user_calls(user_id, limit=50):
        """Get call history for a user"""
        calls = CallHistory._get_collection().find(
            {"$or": [{"caller_id": user_id}, {"receiver_id": user_id}]}
        ).sort("created_at", -1).limit(limit)
        
        result = []
        for call in calls:
            call['_id'] = str(call['_id'])
            result.append(call)
        return result
    
    @staticmethod
    def delete_call(call_id):
        """Delete a call record"""
        CallHistory._get_collection().delete_one({"_id": ObjectId(call_id)})
