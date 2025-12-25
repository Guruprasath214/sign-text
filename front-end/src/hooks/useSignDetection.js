import { useEffect, useRef, useState } from 'react'
import { toast } from 'react-toastify'
import api from '../api'
import socketService from '../services/socket'

/**
 * Hook for real-time sign language detection from video stream
 * @param {boolean} isActive - Whether detection should be active
 * @param {Object} videoRef - Ref to video element
 * @param {string} roomId - Current room ID
 * @param {string} userId - Current user ID
 * @param {string} userName - Current user name
 * @returns {Object} - Detection state and controls
 */
export const useSignDetection = (isActive, videoRef, roomId, userId, userName) => {
  const [isDetecting, setIsDetecting] = useState(false)
  const [lastDetectedSign, setLastDetectedSign] = useState(null)
  const [captionHistory, setCaptionHistory] = useState([])
  const intervalRef = useRef(null)
  const canvasRef = useRef(null)

  // Initialize canvas for frame capture
  useEffect(() => {
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas')
    }
  }, [])

  // Capture frame from video and send to backend
  const captureAndDetect = async () => {
    if (!videoRef?.current || !canvasRef.current || !isActive || !roomId) {
      return
    }

    try {
      const video = videoRef.current
      const canvas = canvasRef.current
      
      // Check if video is playing and has dimensions
      if (video.readyState !== video.HAVE_ENOUGH_DATA) {
        return
      }

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth || 640
      canvas.height = video.videoHeight || 480

      // Draw current video frame to canvas
      const ctx = canvas.getContext('2d')
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      // Convert canvas to base64
      const frameData = canvas.toDataURL('image/jpeg', 0.8)

      // Send to backend for detection
      const response = await api.post('/sign/detect', {
        frame: frameData,
        room_id: roomId,
        user_id: userId,
        timestamp: Date.now()
      })

      const { detected, sign } = response.data

      if (detected && sign) {
        // Only send if it's a new sign (debounce)
        if (sign !== lastDetectedSign) {
          setLastDetectedSign(sign)
          
          // Send caption to room via Socket.IO
          socketService.sendCaption(roomId, sign, 'sign', userId, userName)
          
          // Add to local history
          setCaptionHistory(prev => [...prev, {
            text: sign,
            type: 'sign',
            sender: userName,
            timestamp: new Date().toISOString()
          }])
        }
      }
    } catch (error) {
      // Silently handle errors to avoid spamming console
      if (error.response?.status !== 429) {
        console.error('Sign detection error:', error)
      }
    }
  }

  // Start detection
  const startDetection = () => {
    if (intervalRef.current) {
      stopDetection()
    }

    setIsDetecting(true)
    // Capture frames every 1 second (adjust for performance vs accuracy)
    intervalRef.current = setInterval(captureAndDetect, 1000)
    toast.info('📷 Sign language detection started')
  }

  // Stop detection
  const stopDetection = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setIsDetecting(false)
    setLastDetectedSign(null)
  }

  // Listen for captions from other users
  useEffect(() => {
    if (!roomId) return

    const handleReceiveCaption = (data) => {
      setCaptionHistory(prev => [...prev, {
        text: data.caption,
        type: data.type,
        sender: data.sender_name,
        senderId: data.sender_id,
        timestamp: data.timestamp
      }])
    }

    socketService.socket?.on('receive_caption', handleReceiveCaption)

    return () => {
      socketService.socket?.off('receive_caption', handleReceiveCaption)
    }
  }, [roomId])

  // Auto-start/stop based on isActive
  useEffect(() => {
    if (isActive && roomId && videoRef?.current) {
      startDetection()
    } else {
      stopDetection()
    }

    return () => {
      stopDetection()
    }
  }, [isActive, roomId])

  return {
    isDetecting,
    lastDetectedSign,
    captionHistory,
    setCaptionHistory,
    startDetection,
    stopDetection
  }
}
