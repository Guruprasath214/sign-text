import { useEffect, useState } from 'react'
import { FaClosedCaptioning, FaHistory, FaMicrophone, FaMicrophoneSlash, FaPhone, FaPhoneSlash, FaTrash, FaUsers, FaVideo, FaVideoSlash } from 'react-icons/fa'
import { toast } from 'react-toastify'
import { callAPI } from '../api'
import { useSignDetection } from '../hooks/useSignDetection'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'
import { useWebRTC } from '../hooks/useWebRTC'
import socketService from '../services/socket'
import useAuthStore from '../store/authStore'

function Dashboard() {
  const { user } = useAuthStore()
  const [roomId, setRoomId] = useState('')
  const [isInCall, setIsInCall] = useState(false)
  const [currentRoomId, setCurrentRoomId] = useState(null)
  const [onlineUsers, setOnlineUsers] = useState([])
  const [callHistory, setCallHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [showCaptions, setShowCaptions] = useState(true)

  const {
    localVideoRef,
    remoteVideoRef,
    localStream,
    remoteStream,
    isCallActive,
    isMuted,
    isVideoOff,
    startCall,
    joinCall,
    endCall,
    toggleMute,
    toggleVideo,
  } = useWebRTC(currentRoomId)

  // Sign language detection hook
  const {
    isDetecting,
    captionHistory,
    setCaptionHistory
  } = useSignDetection(
    isCallActive,
    localVideoRef,
    currentRoomId,
    user?.uid,
    user?.displayName || 'User'
  )

  // Speech-to-text recognition hook
  const {
    isListening,
    isSupported: isSpeechSupported
  } = useSpeechRecognition(
    isCallActive,
    currentRoomId,
    user?.uid,
    user?.displayName || 'User',
    isMuted,
    localStream  // Pass localStream to ensure mic permission is granted
  )

  // Generate random room ID
  const generateRoomId = () => {
    return Math.random().toString(36).substring(2, 10).toUpperCase()
  }

  const handleStartCall = async () => {
    const newRoomId = generateRoomId()
    setCurrentRoomId(newRoomId)
    setIsInCall(true)
    
    toast.success(`📞 Room created: ${newRoomId}`)
    
    // Copy to clipboard
    try {
      await navigator.clipboard.writeText(newRoomId)
      toast.info('Room ID copied to clipboard!')
    } catch (err) {
      console.error('Failed to copy:', err)
    }
    
    setTimeout(async () => {
      try {
        await startCall()
      } catch (error) {
        // Error already handled in useWebRTC, just reset UI
        setIsInCall(false)
        setCurrentRoomId(null)
      }
    }, 500)
  }

  const handleJoinCall = () => {
    if (!roomId || roomId.length < 4) {
      toast.error('Please enter a valid room ID')
      return
    }
    
    setCurrentRoomId(roomId)
    setIsInCall(true)
    
    setTimeout(async () => {
      try {
        await joinCall()
      } catch (error) {
        // Error already handled in useWebRTC, just reset UI
        setIsInCall(false)
        setCurrentRoomId(null)
        setRoomId('')
      }
    }, 500)
  }

  const handleEndCall = () => {
    endCall()
    setIsInCall(false)
    setCurrentRoomId(null)
    setRoomId('')
    toast.info('Call ended')
  }

  // Fetch call history
  const fetchCallHistory = async () => {
    setLoadingHistory(true)
    try {
      const response = await callAPI.getHistory(20)
      setCallHistory(response.data.calls || [])
    } catch (error) {
      console.error('Error fetching call history:', error)
      toast.error('Failed to load call history')
    } finally {
      setLoadingHistory(false)
    }
  }

  // Delete call from history
  const handleDeleteCall = async (callId) => {
    try {
      await callAPI.deleteCall(callId)
      setCallHistory(prev => prev.filter(call => call._id !== callId))
      toast.success('Call deleted from history')
    } catch (error) {
      console.error('Error deleting call:', error)
      toast.error('Failed to delete call')
    }
  }

  // Format duration
  const formatDuration = (seconds) => {
    if (!seconds) return 'N/A'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  // Format time
  const formatTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  useEffect(() => {
    // Fetch initial data
    fetchCallHistory()

    // Setup online users listener
    socketService.onOnlineUsersUpdate((data) => {
      setOnlineUsers(data.users || [])
    })

    // Request online users
    socketService.getOnlineUsers((data) => {
      setOnlineUsers(data.users || [])
    })

    return () => {
      if (isCallActive) {
        endCall()
      }
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-beige/30 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Welcome Header */}
        {!isInCall && (
          <div className="text-center mb-12 fade-in">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Welcome, {user?.displayName || 'User'}!
            </h1>
            <p className="text-gray-600">
              Start a video call or join an existing one
            </p>
          </div>
        )}

        {/* Video Call Interface */}
        {isInCall ? (
          <div className="fade-in">
            {/* Room ID Display */}
            <div className="bg-white rounded-lg shadow-lg p-4 mb-4 text-center">
              <p className="text-sm text-gray-600">Room ID</p>
              <p className="text-2xl font-bold text-royal-blue">{currentRoomId}</p>
              <p className="text-xs text-gray-500 mt-1">Share this ID with others to join</p>
            </div>

            {/* Video Grid */}
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              {/* Local Video */}
              <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                  You {isVideoOff && '(Camera Off)'}
                </div>
                {isVideoOff && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                    <FaVideoSlash className="text-6xl text-gray-400" />
                  </div>
                )}
              </div>

              {/* Remote Video */}
              <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
                {remoteStream ? (
                  <>
                    <video
                      ref={remoteVideoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                      Remote User
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="spinner mb-4"></div>
                    <p className="text-white">Waiting for other user...</p>
                  </div>
                )}
              </div>
            </div>

            {/* Live Captions */}
            {showCaptions && (
              <div className="bg-black/80 rounded-lg p-4 mb-4 max-h-40 overflow-y-auto">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <FaClosedCaptioning className="text-white text-lg" />
                    <h3 className="text-white font-semibold">Live Captions</h3>
                    <div className="flex items-center gap-2">
                      {isDetecting && (
                        <span className="text-xs text-blue-400">● Sign Detection</span>
                      )}
                      {isListening && !isMuted && (
                        <span className="text-xs text-green-400">● Speech Recognition</span>
                      )}
                      {!isSpeechSupported && (
                        <span className="text-xs text-yellow-400">⚠ Speech not supported</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setCaptionHistory([])}
                    className="text-xs text-gray-400 hover:text-white"
                  >
                    Clear
                  </button>
                </div>
                <div className="space-y-2">
                  {captionHistory.length === 0 ? (
                    <p className="text-gray-400 text-sm text-center py-2">
                      Captions will appear here...
                    </p>
                  ) : (
                    captionHistory.slice(-5).map((caption, index) => (
                      <div
                        key={`caption-${index}-${caption.timestamp || caption.text?.substring(0, 10)}`}
                        className={`p-2 rounded ${
                          caption.type === 'sign'
                            ? 'bg-blue-900/50 border-l-4 border-blue-400'
                            : 'bg-green-900/50 border-l-4 border-green-400'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-xs text-gray-300 min-w-fit">
                            {caption.sender}:
                          </span>
                          <span className="text-white font-medium">
                            {caption.text}
                          </span>
                          <span className="text-xs ml-auto min-w-fit">
                            {caption.type === 'sign' ? (
                              <span className="text-blue-300">👋 Sign</span>
                            ) : (
                              <span className="text-green-300">🎤 Speech</span>
                            )}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Call Controls */}
            <div className="flex justify-center gap-4">
              <button
                onClick={toggleMute}
                className={`p-4 rounded-full transition-all ${
                  isMuted 
                    ? 'bg-red-500 hover:bg-red-600' 
                    : 'bg-gray-700 hover:bg-gray-800'
                } text-white`}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <FaMicrophoneSlash className="text-2xl" /> : <FaMicrophone className="text-2xl" />}
              </button>

              <button
                onClick={toggleVideo}
                className={`p-4 rounded-full transition-all ${
                  isVideoOff 
                    ? 'bg-red-500 hover:bg-red-600' 
                    : 'bg-gray-700 hover:bg-gray-800'
                } text-white`}
                title={isVideoOff ? 'Turn On Camera' : 'Turn Off Camera'}
              >
                {isVideoOff ? <FaVideoSlash className="text-2xl" /> : <FaVideo className="text-2xl" />}
              </button>

              <button
                onClick={() => setShowCaptions(!showCaptions)}
                className={`p-4 rounded-full transition-all ${
                  showCaptions 
                    ? 'bg-gray-700 hover:bg-gray-800' 
                    : 'bg-red-500 hover:bg-red-600'
                } text-white`}
                title={showCaptions ? 'Hide Captions' : 'Show Captions'}
              >
                <FaClosedCaptioning className="text-2xl" />
              </button>

              <button
                onClick={handleEndCall}
                className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white transition-all"
                title="End Call"
              >
                <FaPhoneSlash className="text-2xl" />
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Main Actions */}
            <div className="grid md:grid-cols-2 gap-8 mb-12">
              
              {/* Start New Call */}
              <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow duration-300">
                <div className="flex flex-col items-center text-center">
                  <div className="bg-royal-blue text-white p-6 rounded-full mb-4">
                    <FaVideo className="text-5xl" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">
                    Start New Call
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Create a new video call room and share the Room ID with others
                  </p>
                  <button
                    onClick={handleStartCall}
                    className="btn-primary w-full"
                  >
                    Start Call
                  </button>
                </div>
              </div>

              {/* Join Existing Call */}
              <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow duration-300">
                <div className="flex flex-col items-center text-center">
                  <div className="bg-secondary text-white p-6 rounded-full mb-4">
                    <FaPhone className="text-5xl" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">
                    Join Call
                  </h2>
                  <p className="text-gray-600 mb-4">
                    Enter a Room ID to join an existing video call
                  </p>
                  <input
                    type="text"
                    placeholder="Enter Room ID"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                    className="input-field mb-4"
                    style={{ paddingLeft: '16px' }}
                  />
                  <button
                    onClick={handleJoinCall}
                    className="btn-secondary w-full"
                  >
                    Join Call
                  </button>
                </div>
              </div>

            </div>

            {/* Additional Features */}
            <div className="grid md:grid-cols-2 gap-6">
              
              {/* Active Users */}
              <div className="bg-white rounded-lg p-6 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <FaUsers className="text-2xl text-royal-blue mr-3" />
                    <h3 className="text-xl font-semibold text-gray-900">
                      Online Users
                    </h3>
                  </div>
                  <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    {onlineUsers.length} online
                  </span>
                </div>
                
                <div className="max-h-64 overflow-y-auto">
                  {onlineUsers.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No other users online</p>
                  ) : (
                    <ul className="space-y-2">
                      {onlineUsers.map((onlineUser) => (
                        <li 
                          key={onlineUser._id} 
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                            <span className="font-medium text-gray-900">
                              {onlineUser.display_name || onlineUser.email}
                            </span>
                          </div>
                          {onlineUser._id !== user?.uid && (
                            <button
                              onClick={() => toast.info('Direct calling coming soon!')}
                              className="text-royal-blue hover:text-royal-blue-dark text-sm font-medium"
                            >
                              Call
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Call History */}
              <div className="bg-white rounded-lg p-6 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <FaHistory className="text-2xl text-royal-blue mr-3" />
                    <h3 className="text-xl font-semibold text-gray-900">
                      Call History
                    </h3>
                  </div>
                  <button
                    onClick={fetchCallHistory}
                    className="text-sm text-royal-blue hover:text-royal-blue-dark"
                    disabled={loadingHistory}
                  >
                    {loadingHistory ? 'Loading...' : 'Refresh'}
                  </button>
                </div>
                
                <div className="max-h-64 overflow-y-auto">
                  {loadingHistory ? (
                    <div className="flex justify-center py-4">
                      <div className="spinner"></div>
                    </div>
                  ) : callHistory.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No call history yet</p>
                  ) : (
                    <ul className="space-y-2">
                      {callHistory.map((call) => (
                        <li 
                          key={call._id} 
                          className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <FaVideo className="text-royal-blue text-sm" />
                                <span className="font-medium text-gray-900 text-sm">
                                  {call.call_type === 'video' ? 'Video Call' : 'Audio Call'}
                                </span>
                              </div>
                              <div className="text-xs text-gray-600 space-y-1">
                                <div>{formatDate(call.start_time)} at {formatTime(call.start_time)}</div>
                                {call.duration && (
                                  <div className="text-gray-500">
                                    Duration: {formatDuration(call.duration)}
                                  </div>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() => handleDeleteCall(call._id)}
                              className="text-red-500 hover:text-red-700 p-1"
                              title="Delete call"
                            >
                              <FaTrash className="text-sm" />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

            </div>
          </>
        )}

      </div>
    </div>
  )
}

export default Dashboard
