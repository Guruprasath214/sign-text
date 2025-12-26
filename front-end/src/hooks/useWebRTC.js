import { useEffect, useRef, useState } from 'react'
import Peer from 'simple-peer'
import socketService from '../services/socket'
import useAuthStore from '../store/authStore'

export const useWebRTC = (roomId) => {
  const [localStream, setLocalStream] = useState(null)
  const [remoteStream, setRemoteStream] = useState(null)
  const [isCallActive, setIsCallActive] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  
  const peerRef = useRef(null)
  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)
  
  const { user } = useAuthStore()

  // Initialize media stream
  const startLocalStream = async () => {
    try {
      // First, check if devices are available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Your browser does not support camera/microphone access. Please use Chrome, Firefox, or Edge.')
      }

      // Enumerate devices to check what's available
      const devices = await navigator.mediaDevices.enumerateDevices()
      const hasVideo = devices.some(device => device.kind === 'videoinput')
      const hasAudio = devices.some(device => device.kind === 'audioinput')
      
      console.log('Available devices:', { hasVideo, hasAudio, devices })
      
      if (!hasVideo && !hasAudio) {
        throw new Error('No camera or microphone found. Please connect a webcam and microphone.')
      }
      
      // Try to get both video and audio with flexible constraints
      let stream = null
      
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: hasVideo ? {
            facingMode: 'user',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          } : false,
          audio: hasAudio ? {
            echoCancellation: true,
            noiseSuppression: true
          } : false
        })
      } catch (err) {
        console.warn('Failed with ideal constraints, trying basic:', err)
        
        // Fallback to basic constraints
        stream = await navigator.mediaDevices.getUserMedia({
          video: hasVideo,
          audio: hasAudio
        })
      }
      
      setLocalStream(stream)
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }
      
      return stream
    } catch (error) {
      console.error('Error accessing media devices:', error)
      
      // Import toast dynamically
      const { toast } = await import('react-toastify')
      
      if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        toast.error('❌ Camera or microphone not found. Please check your device connections and try again.', {
          position: "top-center",
          autoClose: 5000,
        })
      } else if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        toast.error('❌ Camera/microphone access denied. Please allow permissions in your browser settings.', {
          position: "top-center",
          autoClose: 5000,
        })
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        toast.error('❌ Camera/microphone is already in use by another application. Please close other apps and try again.', {
          position: "top-center",
          autoClose: 5000,
        })
      } else {
        toast.error(`❌ Failed to access camera/microphone: ${error.message}`, {
          position: "top-center",
          autoClose: 5000,
        })
      }
      
      throw error
    }
  }

  // Start a call (initiator)
  const startCall = async () => {
    try {
      const stream = await startLocalStream()
      
      // Join room
      socketService.joinRoom(roomId, user?.uid)
      
      // Listen for peer joining
      socketService.onUserJoined((data) => {
        console.log('User joined:', data)
        createPeer(true, stream)
      })
      
      setIsCallActive(true)
    } catch (error) {
      console.error('Error starting call:', error)
      throw error // Re-throw to let Dashboard handle it
    }
  }

  // Join a call (receiver)
  const joinCall = async () => {
    try {
      const stream = await startLocalStream()
      
      // Join room
      socketService.joinRoom(roomId, user?.uid)
      
      // Create peer as receiver
      createPeer(false, stream)
      
      setIsCallActive(true)
    } catch (error) {
      console.error('Error joining call:', error)
      throw error // Re-throw to let Dashboard handle it
    }
  }

  // Create WebRTC peer connection
  const createPeer = (isInitiator, stream) => {
    const peer = new Peer({
      initiator: isInitiator,
      trickle: false,
      stream: stream,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      },
    })

    peer.on('signal', (signal) => {
      if (isInitiator) {
        socketService.sendOffer(roomId, signal, user?.uid)
      } else {
        socketService.sendAnswer(roomId, signal, user?.uid)
      }
    })

    peer.on('stream', (remoteStream) => {
      console.log('Received remote stream')
      setRemoteStream(remoteStream)
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream
      }
    })

    peer.on('error', (error) => {
      console.error('Peer error:', error)
    })

    peer.on('close', () => {
      console.log('Peer connection closed')
      endCall()
    })

    peerRef.current = peer
    return peer
  }

  // Handle incoming signals
  useEffect(() => {
    if (!roomId) return

    socketService.onOffer((data) => {
      console.log('Received offer:', data)
      if (peerRef.current && !peerRef.current.initiator) {
        peerRef.current.signal(data.offer)
      }
    })

    socketService.onAnswer((data) => {
      console.log('Received answer:', data)
      if (peerRef.current && peerRef.current.initiator) {
        peerRef.current.signal(data.answer)
      }
    })

    socketService.onIceCandidate((data) => {
      console.log('Received ICE candidate:', data)
      if (peerRef.current) {
        peerRef.current.signal(data.candidate)
      }
    })

    socketService.onUserLeft(() => {
      console.log('User left the call')
      endCall()
    })

    return () => {
      socketService.removeAllListeners()
    }
  }, [roomId])

  // Toggle mute
  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled
      })
      setIsMuted(!isMuted)
    }
  }

  // Toggle video
  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled
      })
      setIsVideoOff(!isVideoOff)
    }
  }

  // End call
  const endCall = () => {
    // Stop local stream
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop())
      setLocalStream(null)
    }

    // Close peer connection
    if (peerRef.current) {
      peerRef.current.destroy()
      peerRef.current = null
    }

    // Leave room
    if (roomId && user) {
      socketService.leaveRoom(roomId, user.uid)
    }

    setRemoteStream(null)
    setIsCallActive(false)
    setIsMuted(false)
    setIsVideoOff(false)
  }

  return {
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
  }
}
