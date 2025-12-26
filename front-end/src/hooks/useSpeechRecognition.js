import { useEffect, useRef, useState } from 'react'
import { toast } from 'react-toastify'
import socketService from '../services/socket'

/**
 * Hook for real-time speech-to-text using Web Speech API
 * @param {boolean} isActive - Whether recognition should be active
 * @param {string} roomId - Current room ID
 * @param {string} userId - Current user ID
 * @param {string} userName - Current user name
 * @param {boolean} isMuted - Whether microphone is muted
 * @returns {Object} - Recognition state and controls
 */
export const useSpeechRecognition = (isActive, roomId, userId, userName, isMuted) => {
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const recognitionRef = useRef(null)
  const lastTranscriptRef = useRef('')
  const silenceTimeoutRef = useRef(null)

  // Check browser support
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      setIsSupported(true)
      
      // Initialize speech recognition
      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-US'
      recognition.maxAlternatives = 1

      recognitionRef.current = recognition

      // Handle results
      recognition.onresult = (event) => {
        const results = event.results
        const lastResult = results[results.length - 1]
        
        if (lastResult.isFinal) {
          const transcript = lastResult[0].transcript.trim()
          
          // Only send if transcript is different and not empty
          if (transcript && transcript !== lastTranscriptRef.current) {
            lastTranscriptRef.current = transcript
            
            // Send caption to room via Socket.IO
            socketService.sendCaption(roomId, transcript, 'speech', userId, userName)
            
            // Reset silence timeout
            if (silenceTimeoutRef.current) {
              clearTimeout(silenceTimeoutRef.current)
            }
            
            // Clear last transcript after 3 seconds of silence
            silenceTimeoutRef.current = setTimeout(() => {
              lastTranscriptRef.current = ''
            }, 3000)
          }
        }
      }

      // Handle errors
      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
        
        if (event.error === 'not-allowed') {
          toast.error('🎤 Microphone access denied. Please grant microphone permission for speech recognition to work.', {
            position: 'top-center',
            autoClose: 5000
          })
          setIsListening(false)
        } else if (event.error === 'no-speech') {
          // Silently restart - this is normal
          if (isActive && !isMuted) {
            try {
              recognition.start()
            } catch (e) {
              // Already started
            }
          }
        } else if (event.error === 'audio-capture') {
          toast.error('🎤 No microphone found. Please check your device connections.', {
            position: 'top-center',
            autoClose: 5000
          })
          setIsListening(false)
        } else if (event.error === 'network') {
          // Network error - silently ignore and retry
          console.warn('Network error in speech recognition, will auto-retry')
        }
      }

      // Handle end
      recognition.onend = () => {
        // Auto-restart if still active and not muted
        if (isActive && !isMuted && isListening) {
          try {
            recognition.start()
          } catch (e) {
            // Already started or stopped intentionally
          }
        }
      }

      recognition.onstart = () => {
        setIsListening(true)
      }

    } else {
      setIsSupported(false)
      toast.warning('⚠️ Speech recognition not supported in this browser. Use Chrome or Edge.')
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch (e) {
          // Already stopped
        }
      }
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current)
      }
    }
  }, [])

  // Start recognition
  const startRecognition = async () => {
    if (!isSupported) {
      toast.error('Speech recognition not supported in this browser')
      return
    }

    if (!recognitionRef.current) return

    try {
      // Check microphone permission first
      const permissionStatus = await navigator.permissions.query({ name: 'microphone' })
      
      if (permissionStatus.state === 'denied') {
        toast.error('🎤 Microphone permission denied. Please enable it in browser settings.', {
          position: 'top-center',
          autoClose: 5000
        })
        return
      }

      recognitionRef.current.start()
      toast.info('🎤 Speech recognition started', {
        position: 'bottom-right',
        autoClose: 2000
      })
    } catch (error) {
      if (error.message && error.message.includes('already started')) {
        // Already running, that's fine
      } else {
        console.error('Error starting recognition:', error)
      }
    }
  }

  // Stop recognition
  const stopRecognition = () => {
    if (!recognitionRef.current) return

    try {
      recognitionRef.current.stop()
      setIsListening(false)
      lastTranscriptRef.current = ''
    } catch (error) {
      console.error('Error stopping recognition:', error)
    }
  }

  // Auto-start/stop based on call state and mute
  useEffect(() => {
    if (!isSupported) return

    if (isActive && !isMuted && roomId) {
      startRecognition()
    } else {
      stopRecognition()
    }

    return () => {
      stopRecognition()
    }
  }, [isActive, isMuted, roomId, isSupported])

  return {
    isListening,
    isSupported,
    startRecognition,
    stopRecognition
  }
}
