import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'

class SocketService {
  constructor() {
    this.socket = null
    this.connected = false
  }

  connect(userId) {
    if (this.socket) {
      this.disconnect()
    }

    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    })

    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket.id)
      this.connected = true
      
      // Mark user as online
      if (userId) {
        this.socket.emit('user_online', { user_id: userId })
      }
    })

    this.socket.on('disconnect', () => {
      console.log('❌ Socket disconnected')
      this.connected = false
    })

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
    })

    return this.socket
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.connected = false
    }
  }

  // Online users
  getOnlineUsers(callback) {
    if (this.socket) {
      this.socket.emit('get_online_users')
      this.socket.on('online_users_updated', callback)
    }
  }

  onOnlineUsersUpdate(callback) {
    if (this.socket) {
      this.socket.on('online_users_updated', callback)
    }
  }

  // WebRTC signaling
  joinRoom(room, userId) {
    if (this.socket) {
      this.socket.emit('join_room', { room, user_id: userId })
    }
  }

  leaveRoom(room, userId) {
    if (this.socket) {
      this.socket.emit('leave_room', { room, user_id: userId })
    }
  }

  sendOffer(room, offer, senderId) {
    if (this.socket) {
      this.socket.emit('webrtc_offer', { room, offer, sender_id: senderId })
    }
  }

  sendAnswer(room, answer, senderId) {
    if (this.socket) {
      this.socket.emit('webrtc_answer', { room, answer, sender_id: senderId })
    }
  }

  sendIceCandidate(room, candidate, senderId) {
    if (this.socket) {
      this.socket.emit('webrtc_ice_candidate', { room, candidate, sender_id: senderId })
    }
  }

  // Event listeners for WebRTC
  onUserJoined(callback) {
    if (this.socket) {
      this.socket.on('user_joined', callback)
    }
  }

  onUserLeft(callback) {
    if (this.socket) {
      this.socket.on('user_left', callback)
    }
  }

  onOffer(callback) {
    if (this.socket) {
      this.socket.on('webrtc_offer', callback)
    }
  }

  onAnswer(callback) {
    if (this.socket) {
      this.socket.on('webrtc_answer', callback)
    }
  }

  onIceCandidate(callback) {
    if (this.socket) {
      this.socket.on('webrtc_ice_candidate', callback)
    }
  }

  // Caption broadcasting
  sendCaption(room, caption, type, senderId, senderName) {
    if (this.socket) {
      this.socket.emit('send_caption', {
        room,
        caption,
        type, // 'sign' or 'speech'
        sender_id: senderId,
        sender_name: senderName,
        timestamp: new Date().toISOString()
      })
    }
  }

  onCaptionReceived(callback) {
    if (this.socket) {
      this.socket.on('receive_caption', callback)
    }
  }

  // Generic socket methods
  emit(event, data) {
    if (this.socket) {
      this.socket.emit(event, data)
    }
  }

  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback)
    }
  }

  // Remove event listeners
  removeAllListeners() {
    if (this.socket) {
      this.socket.removeAllListeners()
    }
  }
}

export default new SocketService()
