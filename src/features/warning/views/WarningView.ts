import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useSettingsStore } from '../../settings/stores/settings'
import { useInputManager } from '../../../shared/composables/useInputManager'
import { useFaceRecognition } from '../../face-recognition/composables/useFaceRecognition'
import { simpleFlowController } from '../../../core/application/SimpleFlowController'
import { CancellationError, isCancellationError } from '../../../shared/utils/errorHandling'
import { timerManager } from '../../../shared/utils/TimerManager'
import type { TimerHandle } from '../../../shared/utils/TimerManager'
import { ttsService } from '../../../shared/services/TTSService'
import { CleanupCoordinator } from '../../../shared/utils/CleanupCoordinator'
import { protocolLogger } from '../../../shared/services/ProtocolLogger'

/**
 * Warnsystem für intubierte Patienten - MIT CANCELLATION TOKEN
 * 
 * State Machine basierend auf Anforderungsbeschreibung:
 * 1. Begrüßungstext (TTS) → 2. Glocke aktiv → 3. Glocke spielt → 4. Zurück-Button aktiv
 * 
 * Zyklus: Glocke ↔ Zurück-Button wiederholt sich
 */

export function useWarningViewLogic() {
  const router = useRouter()
  const settingsStore = useSettingsStore()
  const faceRecognition = useFaceRecognition()

  // ===== CANCELLATION TOKEN =====
  const isCancelled = ref(false)
  
  const checkCancelled = () => {
    if (isCancelled.value) {
      throw new CancellationError('Operation cancelled')
    }
  }

  // ===== INTRODUCTION STATE =====
  const isIntroductionActive = ref(false)
  
  const startIntroduction = () => {
    isIntroductionActive.value = true
  }
  
  const endIntroduction = () => {
    isIntroductionActive.value = false
  }

  // ===== STATE MACHINE =====
  enum WarningState {
    GREETING = 'greeting',
    BELL_IDLE = 'bell_idle',
    BELL_PLAYING = 'bell_playing',
    BACK_ACTIVE = 'back_active'
  }

  // ===== STATE VARIABLES =====
  const currentState = ref<WarningState>(WarningState.GREETING)
  const statusText = ref("Warnsystem wird gestartet...")
  const isTTSActive = ref(false)
  
  // ===== CONSTANTS =====
  const LOOP_INTERVAL = 4000
  
  // ===== MOBILE DETECTION =====
  const isMobile = () => {
    return window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  }

  // ===== TTS IMPLEMENTATION MIT CANCELLATION =====
  const speakText = async (text: string, onStart?: () => void, onEnd?: () => void): Promise<void> => {
      // Prüfen ob bereits abgebrochen wurde
      if (isCancelled.value) {
      throw new CancellationError('TTS cancelled before start')
      }
      
      console.log('TTS: Speaking:', text)
      
      const isMuted = simpleFlowController.getTTSMuted()
      
    // Erstelle AbortController für Cancellation
    const abortController = new AbortController()
    
    try {
      isTTSActive.value = true
      
      await ttsService.speak(text, {
        lang: 'de-DE',
        rate: 0.8,
        pitch: 1.0,
        volume: isMuted ? 0 : 0.8
      }, {
        signal: abortController.signal,
        timeout: 10000,
        onStart: () => {
        // Prüfen ob während TTS abgebrochen wurde
        if (isCancelled.value) {
            abortController.abort()
          return
        }
        
        console.log('TTS: Started speaking')
        if (onStart) onStart()
        },
        onEnd: () => {
        console.log('TTS: Finished speaking')
          isTTSActive.value = false
        if (onEnd) onEnd()
        },
        onError: (error) => {
          console.error('TTS Error:', error)
          isTTSActive.value = false
        }
      })
    } catch (error) {
      isTTSActive.value = false
      
      // AbortError ist kein echter Fehler
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new CancellationError('TTS cancelled')
      }
      
      throw error
    }
  }

  const delay = async (ms: number): Promise<void> => {
    // Erstelle AbortController für Cancellation
    const abortController = new AbortController()
    
    // Prüfe Cancellation regelmäßig
    const checkHandle = timerManager.setInterval(() => {
      if (isCancelled.value) {
        abortController.abort()
        checkHandle.cancel()
      }
    }, 100)
    
    try {
      await timerManager.delay(ms, abortController.signal)
      checkHandle.cancel()
    } catch (error) {
      checkHandle.cancel()
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new CancellationError('Delay cancelled')
      }
      throw error
    }
  }

  // ===== TIMER MANAGEMENT MIT CANCELLATION =====
  const cleanupCoordinator = new CleanupCoordinator('WarningView')
  const timers: TimerHandle[] = []
  
  const clearTimers = () => {
    if (timers.length > 0) {
      console.log(`WarningView: Clearing ${timers.length} timers`)
      timers.forEach(t => t.cancel())
      timers.length = 0
    }
  }
  
  const setTimer = (callback: () => void, delay: number): void => {
    // Timer nur setzen wenn nicht abgebrochen
    if (isCancelled.value) {
      console.log('WarningView: Timer nicht gesetzt - cancelled')
      return
    }
    
    const handle = timerManager.setTimeout(() => {
      // Prüfen vor Ausführung ob abgebrochen
      if (!isCancelled.value) {
        callback()
      }
      // Timer aus Liste entfernen
      const index = timers.indexOf(handle)
      if (index > -1) {
        timers.splice(index, 1)
      }
    }, delay)
    
    timers.push(handle)
    cleanupCoordinator.registerTimer(handle, `warning-timer-${timers.length}`)
  }

  // ===== AUDIO SYSTEM =====
  const audioContext = ref<AudioContext | null>(null)
  const isAlarmActive = ref(false)
  const alarmInterval = ref<TimerHandle | null>(null)
  const audioUnlocked = ref(false) // Track if audio has been unlocked via user interaction

  // Initialize and unlock AudioContext (required for iOS Safari)
  const unlockAudioContext = async () => {
    if (audioUnlocked.value && audioContext.value) {
      // Already unlocked, just resume if suspended
      if (audioContext.value.state === 'suspended') {
        await audioContext.value.resume()
        // Wait for context to be running
        // Note: After resume(), state can still be 'suspended' on some browsers
        // so we need to wait for it to become 'running'
        await new Promise<void>(resolve => {
          const checkState = () => {
            const state = audioContext.value?.state
            if (state === 'running') {
              resolve()
            } else if (state === 'closed') {
              resolve() // Context closed, can't proceed
            } else {
              setTimeout(checkState, 10)
            }
          }
          checkState()
        })
      }
      return
    }

    try {
      // Create AudioContext if it doesn't exist
      if (!audioContext.value) {
        audioContext.value = new (window.AudioContext || (window as any).webkitAudioContext)()
      }

      const ctx = audioContext.value

      // Resume if suspended (iOS Safari starts in suspended state)
      if (ctx.state === 'suspended') {
        await ctx.resume()
      }

      // Wait for context to be running (iOS Safari needs this)
      const currentState = ctx.state
      if (currentState !== 'running') {
        await new Promise<void>((resolve) => {
          const checkState = () => {
            if (ctx.state === 'running') {
              resolve()
            } else {
              setTimeout(checkState, 10)
            }
          }
          checkState()
        })
      }

      // Play a very short, silent sound to "unlock" audio on iOS
      // This must happen in response to a user interaction
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)
      
      // Silent sound (gain = 0) - but we need to actually play something
      // iOS Safari requires a real audio event, even if silent
      gainNode.gain.setValueAtTime(0.001, ctx.currentTime) // Very quiet but not silent
      oscillator.frequency.setValueAtTime(1, ctx.currentTime) // Very low frequency
      oscillator.type = 'sine'
      
      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + 0.01) // Slightly longer to ensure it's processed
      
      // Wait a bit to ensure the unlock sound is processed
      await new Promise(resolve => setTimeout(resolve, 20))
      
      audioUnlocked.value = true
      console.log('AudioContext unlocked for iOS Safari, state:', ctx.state)
    } catch (error) {
      console.error('Error unlocking audio context:', error)
    }
  }

  const playAlarmSound = async () => {
    try {
      // Ensure audio is unlocked before playing
      await unlockAudioContext()
      
      if (!audioContext.value) {
        console.warn('AudioContext not available')
        return
      }

      const ctx = audioContext.value

      // Ensure context is running
      if (ctx.state === 'suspended') {
        await ctx.resume()
      }
      
      const oscillator1 = ctx.createOscillator()
      const oscillator2 = ctx.createOscillator()
      const gainNode = ctx.createGain()
      
      oscillator1.connect(gainNode)
      oscillator2.connect(gainNode)
      gainNode.connect(ctx.destination)
      
      oscillator1.frequency.setValueAtTime(1000, ctx.currentTime)
      oscillator2.frequency.setValueAtTime(1200, ctx.currentTime)
      oscillator1.type = 'sine'
      oscillator2.type = 'sine'
      
      gainNode.gain.setValueAtTime(0.9, ctx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
      
      oscillator1.start(ctx.currentTime)
      oscillator2.start(ctx.currentTime)
      oscillator1.stop(ctx.currentTime + 0.3)
      oscillator2.stop(ctx.currentTime + 0.3)
      
    } catch (error) {
      console.error('Error playing alarm sound:', error)
    }
  }

  const startContinuousAlarm = async () => {
    if (isAlarmActive.value) return
    
    isAlarmActive.value = true
    console.log('Starting continuous alarm')
    
    // Logge Warngeräusch-Start
    try {
      protocolLogger.logWarning('started')
    } catch (error) {
      console.warn('WarningView: Failed to log warning start', error)
    }
    
    // Ensure audio is unlocked before starting alarm
    await unlockAudioContext()
    await playAlarmSound()
    
    alarmInterval.value = timerManager.setInterval(async () => {
      if (isAlarmActive.value && !isCancelled.value) {
        await playAlarmSound()
      } else if (isCancelled.value && alarmInterval.value) {
        alarmInterval.value.cancel()
        alarmInterval.value = null
      }
    }, 500)
    
    if (alarmInterval.value) {
      cleanupCoordinator.registerTimer(alarmInterval.value, 'alarm-interval')
    }
  }

  const stopContinuousAlarm = () => {
    if (!isAlarmActive.value) return
    
    isAlarmActive.value = false
    console.log('Stopping continuous alarm')
    
    // Logge Warngeräusch-Stopp
    try {
      protocolLogger.logWarning('stopped')
    } catch (error) {
      console.warn('WarningView: Failed to log warning stop', error)
    }
    
    if (alarmInterval.value) {
      alarmInterval.value.cancel()
      alarmInterval.value = null
    }
  }

  // ===== STATE MACHINE LOGIC MIT CANCELLATION =====
  
  const transitionTo = async (newState: WarningState) => {
    try {
      checkCancelled() // Prüfen vor Transition
      
      console.log(`Transitioning from ${currentState.value} to ${newState}`)
      // Timer werden automatisch durch isCancelled gestoppt, kein manuelles clearTimers() nötig
      currentState.value = newState

      switch (newState) {
        case WarningState.GREETING:
          await startGreeting()
          break
        case WarningState.BELL_IDLE:
          await startBellIdle()
          break
        case WarningState.BELL_PLAYING:
          await startBellPlaying()
          break
        case WarningState.BACK_ACTIVE:
          await startBackActive()
          break
      }
    } catch (error) {
      if (isCancellationError(error)) {
        console.log('WarningView: Transition cancelled')
      } else {
        console.error('WarningView: Transition error:', error)
      }
    }
  }
  
  const startGreeting = async () => {
    try {
      checkCancelled()
      console.log('State: GREETING - Starting greeting')
      
      const isMuted = simpleFlowController.getTTSMuted()
      if (isMuted) {
        console.log('WarningView: TTS is muted - skipping greeting')
        await transitionTo(WarningState.BELL_IDLE)
        return
      }
      
      startIntroduction()
      
      if (isMobile()) {
        statusText.value = "Blinzeln oder Tippen um ein Warngeräusch auszulösen."
      } else {
        statusText.value = "Blinzeln Sie oder tippen Sie, um ein Warngeräusch auszulösen. Blinzeln oder tippen Sie erneut, um das Warngeräusch zu stoppen."
      }
      
      await speakText(statusText.value)
      
      checkCancelled() // Prüfen nach TTS
      
      endIntroduction()
      await transitionTo(WarningState.BELL_IDLE)
      
    } catch (error) {
      if (isCancellationError(error)) {
        console.log('WarningView: Greeting cancelled')
      } else {
        console.warn('TTS nicht verfügbar:', error)
        await delay(3000)
        endIntroduction()
        await transitionTo(WarningState.BELL_IDLE)
      }
    }
  }

  const startBellIdle = async () => {
    try {
      checkCancelled()
      console.log('State: BELL_IDLE - Bell ready')
      statusText.value = "Warngeräusch abspielen."
      
      await speakText(statusText.value)
      
      checkCancelled() // Prüfen nach TTS
      
      if (!isAlarmActive.value) {
        setTimer(() => {
          // Nochmal prüfen vor Auto-Transition
          if (currentState.value === WarningState.BELL_IDLE && !isAlarmActive.value && !isCancelled.value) {
            transitionTo(WarningState.BACK_ACTIVE)
          }
        }, LOOP_INTERVAL)
      }
      
    } catch (error) {
      if (isCancellationError(error)) {
        console.log('WarningView: Bell idle cancelled')
      } else {
        console.warn('TTS Fehler:', error)
        await delay(2000)
      }
    }
  }

  const startBellPlaying = async () => {
    try {
      checkCancelled()
      console.log('State: BELL_PLAYING - Alarm playing')
      statusText.value = "Warngeräusch läuft..."
      await startContinuousAlarm()
      
    } catch (error) {
      if (isCancellationError(error)) {
        console.log('WarningView: Bell playing cancelled')
      }
    }
  }

  const startBackActive = async () => {
    try {
      checkCancelled()
      console.log('State: BACK_ACTIVE - Back button ready')
      statusText.value = "Zurück zum Hauptmenü."
      
      await speakText(statusText.value)
      
      checkCancelled() // Prüfen nach TTS
      
      if (!isAlarmActive.value) {
        setTimer(() => {
          // Nochmal prüfen vor Auto-Transition
          if (currentState.value === WarningState.BACK_ACTIVE && !isAlarmActive.value && !isCancelled.value) {
            transitionTo(WarningState.BELL_IDLE)
          }
        }, LOOP_INTERVAL)
      }
      
    } catch (error) {
      if (isCancellationError(error)) {
        console.log('WarningView: Back active cancelled')
      } else {
        console.warn('TTS Fehler:', error)
        await delay(2000)
      }
    }
  }

  // ===== USER INTERACTION =====
  const handleUserInput = async () => {
    try {
      checkCancelled()
      
      // Ignoriere Input während der Einführung
      if (isIntroductionActive.value) {
        console.log('WarningView: Input ignored during introduction phase')
        return
      }
      
      console.log('User input detected in state:', currentState.value)
      
      // Unlock audio on first user interaction (required for iOS Safari)
      await unlockAudioContext()
      
      if (currentState.value === WarningState.GREETING) {
        return
      }
      
      // Stoppe laufende TTS (wird durch cleanup() auch gemacht, aber hier für sofortige Reaktion)
      speechSynthesis.cancel()
      
      switch (currentState.value) {
        case WarningState.BELL_IDLE:
          await transitionTo(WarningState.BELL_PLAYING)
          break
          
        case WarningState.BELL_PLAYING:
          stopContinuousAlarm()
          setTimer(() => {
            transitionTo(WarningState.BACK_ACTIVE)
          }, 2000)
          break
          
        case WarningState.BACK_ACTIVE:
          stopContinuousAlarm()
          router.push('/app')
          break
      }
    } catch (error) {
      if (isCancellationError(error)) {
        console.log('WarningView: User input cancelled')
      }
    }
  }

  // ===== LIFECYCLE =====
  const start = async () => {
    console.log('WarningView: Starting warning system')
    await startGreeting()
  }

  const cleanup = async () => {
    console.log('WarningView: Cleanup started')
    
    // 1. Cancellation Flag SOFORT setzen
    // Alle async Operationen stoppen automatisch (weil sie isCancelled checken)
    isCancelled.value = true
    
    // 2. Stoppe Input Manager
    inputManager.stop()
    
    // 3. Stoppe alle laufenden TTS
    ttsService.cancel()
    
    // 4. Stoppe Alarm
    stopContinuousAlarm()
    
    // 5. Resource-Cleanup
    clearTimers()
    
    // 6. CleanupCoordinator führt alle registrierten Cleanups aus
    await cleanupCoordinator.execute()
    
    if (audioContext.value) {
      audioContext.value.close()
      audioContext.value = null
    }
    
    console.log('WarningView: Cleanup complete')
  }

  // ===== TOUCH EVENT HANDLERS =====
  const handleTouchStart = async (event: TouchEvent) => {
    if (isCancelled.value) return
    
    // Unlock audio on first touch (required for iOS Safari)
    await unlockAudioContext()
    
    const target = event.target as HTMLElement
    const bellButton = target.closest('.bell-button')
    const backButton = target.closest('.back-action-button')
    
    if (bellButton && (currentState.value === WarningState.BELL_IDLE || currentState.value === WarningState.BELL_PLAYING)) {
      console.log('WarningView: Touch start on active bell button')
    } else if (backButton && currentState.value === WarningState.BACK_ACTIVE) {
      console.log('WarningView: Touch start on active back button')
    } else {
      event.preventDefault()
      event.stopPropagation()
    }
  }

  const handleTouchEnd = async (event: TouchEvent) => {
    if (isCancelled.value) return
    
    // Unlock audio on first touch (required for iOS Safari)
    await unlockAudioContext()
    
    const target = event.target as HTMLElement
    const bellButton = target.closest('.bell-button')
    const backButton = target.closest('.back-action-button')
    
    if (bellButton && (currentState.value === WarningState.BELL_IDLE || currentState.value === WarningState.BELL_PLAYING)) {
      handleUserInput()
    } else if (backButton && currentState.value === WarningState.BACK_ACTIVE) {
      handleUserInput()
    } else {
      event.preventDefault()
      event.stopPropagation()
    }
  }

  // ===== INPUT MANAGER =====
  const inputManager = useInputManager({
    onSelect: (event) => {
      console.log('WarningView: Input detected', {
        type: event.type,
        source: event.source,
        state: currentState.value
      })
      handleUserInput()
    },
    enabledInputs: ['blink', 'click'],
    cooldown: 300
  })

  const setupWarningSystem = async () => {
    console.log('WarningView: Setting up warning system')
    
    // Stelle sicher, dass Face Recognition läuft (für Blink Detection)
    if (!faceRecognition.isActive.value) {
      console.log('Face Recognition nicht aktiv - starte sie')
      await faceRecognition.start()
    } else {
      console.log('Face Recognition bereits aktiv')
    }
    
    // Starte Input Manager ZUERST (wichtig für Event-Listener)
    inputManager.start()
    console.log('InputManager started, status:', inputManager.getStatus())
    
    // Touch Events für Mobile (separat, da InputManager Touch nicht für Buttons verwendet)
    document.addEventListener('touchstart', handleTouchStart, { passive: false })
    document.addEventListener('touchend', handleTouchEnd, { passive: false })
    
    // Start nach Event Listener Setup
    await start()
    
    return () => {
      inputManager.stop()
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }

  return {
    currentState,
    statusText,
    isTTSActive,
    isAlarmActive,
    handleUserInput,
    setupWarningSystem,
    cleanup,
    settingsStore
  }
}
