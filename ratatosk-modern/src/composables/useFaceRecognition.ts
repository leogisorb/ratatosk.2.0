import { ref, onMounted, onUnmounted, readonly } from 'vue'
import type { FaceRecognitionState, EyeState, FaceLandmarks } from '@/types'

export function useFaceRecognition() {
  // State
  const isActive = ref(false)
  const isDetected = ref(false)
  const confidence = ref(0)
  const eyeState = ref<EyeState>({
    left: true,
    right: true,
    confidence: 0
  })
  const landmarks = ref<FaceLandmarks[]>([])
  const error = ref<string | null>(null)
  const isLoading = ref(false)

  // MediaPipe variables
  let faceMesh: any = null
  let camera: any = null
  let videoElement: HTMLVideoElement | null = null

  // Configuration
  const config = {
    maxNumFaces: 1,
    refineLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
    faceFactor: 55, // Threshold for eye closure detection
    blinkDuration: 2 // Seconds eyes must be closed
  }

  // Eye detection landmarks (MediaPipe Face Mesh)
  const EYE_LANDMARKS = {
    LEFT_EYE: {
      TOP: 386,
      BOTTOM: 374,
      LEFT: 263,
      RIGHT: 362
    },
    RIGHT_EYE: {
      TOP: 159,
      BOTTOM: 145,
      LEFT: 33,
      RIGHT: 133
    }
  }

  // Initialize MediaPipe
  async function initializeMediaPipe() {
    try {
      isLoading.value = true
      error.value = null

      console.log('Face Recognition Initialisierung gestartet...')

      // Create video element first
      videoElement = document.createElement('video')
      videoElement.style.display = 'none'
      document.body.appendChild(videoElement)

      console.log('Video-Element erstellt')

      // Try to get camera access first
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' } 
      })

      console.log('Kamera-Stream erhalten')

      // Connect video to stream
      videoElement.srcObject = stream
      await videoElement.play()

      console.log('Kamera erfolgreich gestartet')

      // Try to initialize MediaPipe
      try {
        const { FaceMesh } = await import('@mediapipe/face_mesh')
        const { Camera } = await import('@mediapipe/camera_utils')

        faceMesh = new FaceMesh({
          locateFile: (file: string) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
          }
        })

        faceMesh.setOptions({
          maxNumFaces: config.maxNumFaces,
          refineLandmarks: config.refineLandmarks,
          minDetectionConfidence: config.minDetectionConfidence,
          minTrackingConfidence: config.minTrackingConfidence
        })

        faceMesh.onResults(onResults)

        // Initialize camera with MediaPipe
        camera = new Camera(videoElement, {
          onFrame: async () => {
            if (videoElement && faceMesh) {
              await faceMesh.send({ image: videoElement })
            }
          }
        })

        await camera.start()
        isActive.value = true
        console.log('MediaPipe Face Recognition erfolgreich initialisiert')
      } catch (mediaPipeError) {
        console.warn('MediaPipe nicht verfügbar, aber Kamera funktioniert:', mediaPipeError)
        // Kamera funktioniert, aber MediaPipe nicht - das ist OK
        isActive.value = true
        error.value = 'MediaPipe nicht verfügbar, aber Kamera funktioniert'
      }

    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Kamera konnte nicht gestartet werden'
      console.error('Kamera-Initialisierung Fehler:', err)
    } finally {
      isLoading.value = false
    }
  }

  // Process face detection results
  function onResults(results: any) {
    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
      const faceLandmarks = results.multiFaceLandmarks[0]
      landmarks.value = faceLandmarks.map((landmark: any) => ({
        x: landmark.x,
        y: landmark.y,
        z: landmark.z
      }))

      // Detect eye state
      const newEyeState = detectEyeState(faceLandmarks)
      eyeState.value = newEyeState

      isDetected.value = true
      confidence.value = results.multiFaceLandmarks.length > 0 ? 1 : 0
    } else {
      isDetected.value = false
      confidence.value = 0
    }
  }

  // Detect if eyes are open or closed
  function detectEyeState(faceLandmarks: any[]): EyeState {
    const leftEyeOpen = detectEyeOpen(faceLandmarks, EYE_LANDMARKS.LEFT_EYE)
    const rightEyeOpen = detectEyeOpen(faceLandmarks, EYE_LANDMARKS.RIGHT_EYE)

    return {
      left: leftEyeOpen,
      right: rightEyeOpen,
      confidence: (leftEyeOpen && rightEyeOpen) ? 1 : 0.5
    }
  }

  // Detect if a specific eye is open
  function detectEyeOpen(landmarks: any[], eyeLandmarks: any): boolean {
    const top = landmarks[eyeLandmarks.TOP]
    const bottom = landmarks[eyeLandmarks.BOTTOM]
    const left = landmarks[eyeLandmarks.LEFT]
    const right = landmarks[eyeLandmarks.RIGHT]

    if (!top || !bottom || !left || !right) {
      return true // Default to open if landmarks not found
    }

    // Calculate eye height and width
    const eyeHeight = Math.abs(top.y - bottom.y)
    const eyeWidth = Math.abs(left.x - right.x)

    // Calculate face size for normalization
    const faceHeight = Math.abs(landmarks[10].y - landmarks[152].y)
    const faceWidth = Math.abs(landmarks[10].x - landmarks[152].x)
    const faceSize = Math.max(faceHeight, faceWidth)

    // Normalize eye measurements
    const normalizedEyeHeight = eyeHeight * faceSize
    const threshold = faceSize / config.faceFactor

    return normalizedEyeHeight > threshold
  }

  // Start face recognition
  async function start() {
    if (!isActive.value) {
      await initializeMediaPipe()
    }
  }

  // Stop face recognition
  function stop() {
    if (camera) {
      camera.stop()
    }
    if (videoElement) {
      videoElement.remove()
      videoElement = null
    }
    isActive.value = false
    isDetected.value = false
    landmarks.value = []
  }

  // Update configuration
  function updateConfig(newConfig: Partial<typeof config>) {
    Object.assign(config, newConfig)
  }

  // Get current face recognition state
  function getState(): FaceRecognitionState {
    return {
      isDetected: isDetected.value,
      eyes: eyeState.value,
      landmarks: landmarks.value,
      confidence: confidence.value
    }
  }

  // Check if both eyes are closed (for blink detection)
  function isBlinking(): boolean {
    return !eyeState.value.left && !eyeState.value.right
  }

  // Cleanup on unmount
  onUnmounted(() => {
    stop()
  })

  return {
    // State
    isActive,
    isDetected,
    confidence,
    eyeState,
    landmarks,
    error,
    isLoading,

    // Actions
    start,
    stop,
    updateConfig,
    getState,
    isBlinking
  }
} 