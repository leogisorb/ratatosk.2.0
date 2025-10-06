import { ref, onMounted, onUnmounted, readonly } from 'vue'
import type { FaceRecognitionState, EyeState, FaceLandmarks } from '../../../shared/types/index'

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
      
      // Prüfe Kamera-Berechtigung
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Kamera-API nicht unterstützt in diesem Browser')
      }
      
      // Safari-Erkennung und spezielle Behandlung
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
      console.log('Browser erkannt:', navigator.userAgent, 'Safari:', isSafari)
      
      // Prüfe verfügbare Kameras
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter(device => device.kind === 'videoinput')
      console.log('Verfügbare Kameras:', videoDevices.length)

      // Create video element first
      videoElement = document.createElement('video')
      videoElement.style.display = 'none'
      document.body.appendChild(videoElement)

      console.log('Video-Element erstellt')

      // Safari-kompatible Kamera-Initialisierung
      let stream: MediaStream | undefined
      
      try {
        // Erste Versuche mit verschiedenen Konfigurationen für Safari
        const constraints = [
          { video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } } },
          { video: { facingMode: 'user' } },
          { video: true },
          { video: { width: { ideal: 640 }, height: { ideal: 480 } } },
          { video: { width: 640, height: 480 } }
        ]
        
        let streamObtained = false
        for (const constraint of constraints) {
          try {
            console.log('Versuche Kamera-Zugriff mit:', constraint)
            stream = await navigator.mediaDevices.getUserMedia(constraint)
            console.log('Kamera-Stream erhalten mit:', constraint)
            streamObtained = true
            break
          } catch (err) {
            console.warn('Kamera-Zugriff fehlgeschlagen mit:', constraint, err)
            continue
          }
        }
        
        if (!streamObtained || !stream) {
          throw new Error('Kamera-Zugriff auf allen Konfigurationen fehlgeschlagen')
        }

        // Connect video to stream
        videoElement.srcObject = stream
        
        // Warte auf Video-Load
        await new Promise((resolve, reject) => {
          videoElement.onloadedmetadata = () => {
            console.log('Video-Metadaten geladen')
            resolve(true)
          }
          videoElement.onerror = (error) => {
            console.error('Video-Load-Fehler:', error)
            reject(error)
          }
          // Timeout nach 5 Sekunden
          setTimeout(() => {
            if (videoElement.readyState < 2) {
              reject(new Error('Video-Load-Timeout'))
            }
          }, 5000)
        })
        
        // Safari-spezifische Video-Initialisierung
        videoElement.muted = true
        videoElement.playsInline = true
        videoElement.setAttribute('playsinline', 'true')
        videoElement.setAttribute('webkit-playsinline', 'true')
        videoElement.setAttribute('x-webkit-airplay', 'deny')
        
        // Safari-spezifische zusätzliche Attribute
        if (isSafari) {
          videoElement.setAttribute('autoplay', 'true')
          videoElement.setAttribute('muted', 'true')
          videoElement.setAttribute('loop', 'false')
          console.log('Safari-spezifische Video-Attribute gesetzt')
        }
        
        // Warten bis Video geladen ist
        await new Promise((resolve, reject) => {
          videoElement!.onloadedmetadata = () => {
            console.log('Video-Metadaten geladen')
            resolve(true)
          }
          videoElement!.onerror = (err) => {
            console.error('Video-Fehler:', err)
            reject(err)
          }
          
          // Fallback für Safari
          setTimeout(() => {
            if (videoElement!.readyState >= 2) {
              resolve(true)
            }
          }, 1000)
        })
        
        await videoElement.play()
        console.log('Kamera erfolgreich gestartet')

      } catch (err) {
        console.error('Kamera-Initialisierung fehlgeschlagen:', err)
        
        // Safari-spezifische Fehlerbehandlung
        if (isSafari) {
          console.log('Safari-spezifische Fehlerbehandlung aktiviert')
          // Versuche alternative Initialisierung für Safari
          try {
            // Warte kurz und versuche erneut
            await new Promise(resolve => setTimeout(resolve, 1000))
            console.log('Safari: Versuche alternative Kamera-Initialisierung...')
            
            // Alternative Safari-Konfiguration
            const safariStream = await navigator.mediaDevices.getUserMedia({ 
              video: { 
                facingMode: 'user',
                width: { min: 320, ideal: 640, max: 1280 },
                height: { min: 240, ideal: 480, max: 720 }
              } 
            })
            
            videoElement.srcObject = safariStream
            await videoElement.play()
            console.log('Safari: Alternative Kamera-Initialisierung erfolgreich')
            
          } catch (safariErr) {
            console.error('Safari: Alternative Kamera-Initialisierung fehlgeschlagen:', safariErr)
            throw new Error(`Safari Kamera-Zugriff fehlgeschlagen: ${safariErr instanceof Error ? safariErr.message : 'Unbekannter Safari-Fehler'}`)
          }
        } else {
          throw new Error(`Kamera-Zugriff fehlgeschlagen: ${err instanceof Error ? err.message : 'Unbekannter Fehler'}`)
        }
      }

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
    if (isActive.value) {
      console.log('Face Recognition bereits aktiv')
      return
    }
    
    console.log('Starte Face Recognition...')
    try {
      await initializeMediaPipe()
      console.log('Face Recognition erfolgreich gestartet')
    } catch (err) {
      console.error('Face Recognition Start fehlgeschlagen:', err)
      error.value = `Face Recognition konnte nicht gestartet werden: ${err instanceof Error ? err.message : 'Unbekannter Fehler'}`
      throw err
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