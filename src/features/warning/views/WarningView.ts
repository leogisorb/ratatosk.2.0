import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useSettingsStore } from '../../settings/stores/settings'
import { useBlinkInput } from '../../communication/composables/useBlinkInput'
import { simpleFlowController } from '../../../core/application/SimpleFlowController'
import { CancellationError, isCancellationError } from '../../../shared/utils/errorHandling'

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

  // ===== CANCELLATION TOKEN =====
  const isCancelled = ref(false)
  
  const checkCancelled = () => {
    if (isCancelled.value) {
      throw new CancellationError('Operation cancelled')
    }
  }

  // ===== BLINK INPUT =====
  const { setupEventListeners, startIntroduction, endIntroduction } = useBlinkInput()

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
  const speakText = (text: string, onStart?: () => void, onEnd?: () => void): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Prüfen ob bereits abgebrochen wurde
      if (isCancelled.value) {
        reject(new CancellationError('TTS cancelled before start'))
        return
      }
      
      console.log('TTS: Speaking:', text)
      
      const isMuted = simpleFlowController.getTTSMuted()
      
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'de-DE'
      utterance.rate = 0.8
      utterance.pitch = 1.0
      utterance.volume = isMuted ? 0 : 0.8

      let resolved = false
      let timeoutId: number | null = null

      const finish = (error?: Error) => {
        if (!resolved) {
          resolved = true
          isTTSActive.value = false
          
          if (timeoutId) {
            clearTimeout(timeoutId)
            timeoutId = null
          }
          
          if (error) {
            reject(error)
          } else {
            resolve()
          }
        }
      }

      utterance.onstart = () => {
        // Prüfen ob während TTS abgebrochen wurde
        if (isCancelled.value) {
          speechSynthesis.cancel()
          finish(new CancellationError('TTS cancelled during start'))
          return
        }
        
        console.log('TTS: Started speaking')
        isTTSActive.value = true
        if (onStart) onStart()
      }

      utterance.onend = () => {
        console.log('TTS: Finished speaking')
        if (onEnd) onEnd()
        finish()
      }

      utterance.onerror = (e) => {
        console.error('TTS Error:', e)
        finish(new Error('TTS error'))
      }

      // Timeout als Fallback
      timeoutId = window.setTimeout(() => {
        if (!resolved) {
          console.warn('TTS: Timeout reached')
          speechSynthesis.cancel()
          finish(new Error('TTS timeout'))
        }
      }, 10000)
      
      speechSynthesis.speak(utterance)
    })
  }

  const delay = (ms: number): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Prüfen ob bereits abgebrochen wurde
      if (isCancelled.value) {
        reject(new CancellationError('Delay cancelled'))
        return
      }
      
      const timeoutId = window.setTimeout(() => {
        if (isCancelled.value) {
          reject(new CancellationError('Delay cancelled'))
        } else {
          resolve()
        }
      }, ms)
      
      // Cleanup bei Abbruch (vereinfacht - nur einmal prüfen)
      // Cancellation wird durch cleanup() → speechSynthesis.cancel() gehandhabt
    })
  }

  // ===== TIMER MANAGEMENT MIT CANCELLATION =====
  let timers: number[] = []
  
  const clearTimers = () => {
    if (timers.length > 0) {
      console.log(`WarningView: Clearing ${timers.length} timers`)
      timers.forEach(t => clearTimeout(t))
      timers = []
    }
  }
  
  const setTimer = (callback: () => void, delay: number): void => {
    // Timer nur setzen wenn nicht abgebrochen
    if (isCancelled.value) {
      console.log('WarningView: Timer nicht gesetzt - cancelled')
      return
    }
    
    const id = window.setTimeout(() => {
      // Prüfen vor Ausführung ob abgebrochen
      if (!isCancelled.value) {
        callback()
      }
      // Timer aus Liste entfernen
      timers = timers.filter(t => t !== id)
    }, delay)
    timers.push(id)
  }

  // ===== AUDIO SYSTEM =====
  const audioContext = ref<AudioContext | null>(null)
  const isAlarmActive = ref(false)
  const alarmInterval = ref<number | null>(null)

  const playAlarmSound = () => {
    try {
      if (!audioContext.value) {
        audioContext.value = new (window.AudioContext || (window as any).webkitAudioContext)()
      }
      
      const ctx = audioContext.value
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

  const startContinuousAlarm = () => {
    if (isAlarmActive.value) return
    
    isAlarmActive.value = true
    console.log('Starting continuous alarm')
    
    playAlarmSound()
    
    alarmInterval.value = window.setInterval(() => {
      if (isAlarmActive.value && !isCancelled.value) {
        playAlarmSound()
      }
    }, 500)
  }

  const stopContinuousAlarm = () => {
    if (!isAlarmActive.value) return
    
    isAlarmActive.value = false
    console.log('Stopping continuous alarm')
    
    if (alarmInterval.value) {
      clearInterval(alarmInterval.value)
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
      startContinuousAlarm()
      
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
      console.log('User input detected in state:', currentState.value)
      
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

  const cleanup = () => {
    console.log('WarningView: Cleanup started')
    
    // 1. Cancellation Flag SOFORT setzen
    // Alle async Operationen stoppen automatisch (weil sie isCancelled checken)
    isCancelled.value = true
    
    // 2. Stoppe alle laufenden TTS (einmalig, nicht mehrfach)
    speechSynthesis.cancel()
    
    // 3. Stoppe Alarm
    stopContinuousAlarm()
    
    // 4. Resource-Cleanup
    clearTimers()
    
    if (audioContext.value) {
      audioContext.value.close()
      audioContext.value = null
    }
    
    console.log('WarningView: Cleanup complete')
  }

  // ===== TOUCH EVENT HANDLERS =====
  const handleTouchStart = (event: TouchEvent) => {
    if (isCancelled.value) return
    
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

  const handleTouchEnd = (event: TouchEvent) => {
    if (isCancelled.value) return
    
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

  const setupWarningSystem = async () => {
    console.log('WarningView: Setting up warning system')
    
    const cleanupEventListeners = setupEventListeners(handleUserInput)
    
    document.addEventListener('touchstart', handleTouchStart, { passive: false })
    document.addEventListener('touchend', handleTouchEnd, { passive: false })
    
    // Start nach Event Listener Setup
    await start()
    
    return () => {
      cleanupEventListeners()
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
