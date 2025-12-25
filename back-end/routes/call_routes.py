from flask import Blueprint, request, jsonify
from models.call_history import CallHistory
from utils.auth import token_required
from datetime import datetime

call_bp = Blueprint('calls', __name__)

@call_bp.route('/history', methods=['GET'])
@token_required
def get_call_history():
    """Get call history for current user"""
    try:
        limit = request.args.get('limit', 50, type=int)
        calls = CallHistory.get_user_calls(request.user_id, limit)
        
        return jsonify({
            'calls': calls,
            'count': len(calls)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@call_bp.route('/start', methods=['POST'])
@token_required
def start_call():
    """Start a new call"""
    try:
        data = request.get_json()
        receiver_id = data.get('receiver_id')
        call_type = data.get('call_type', 'video')
        
        if not receiver_id:
            return jsonify({'error': 'Receiver ID is required'}), 400
        
        # Create call record
        call = CallHistory.create_call(request.user_id, receiver_id, call_type)
        
        return jsonify({
            'message': 'Call initiated',
            'call': call
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@call_bp.route('/<call_id>/end', methods=['PUT'])
@token_required
def end_call(call_id):
    """End a call"""
    try:
        CallHistory.update_call_status(call_id, 'completed', datetime.utcnow())
        
        return jsonify({
            'message': 'Call ended successfully'
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@call_bp.route('/<call_id>', methods=['DELETE'])
@token_required
def delete_call(call_id):
    """Delete a call from history"""
    try:
        CallHistory.delete_call(call_id)
        
        return jsonify({
            'message': 'Call deleted successfully'
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
