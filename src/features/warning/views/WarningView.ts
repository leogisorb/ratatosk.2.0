import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSettingsStore } from '../../settings/stores/settings'
import { useBlinkInput } from '../../communication/composables/useBlinkInput'
import { simpleFlowController } from '../../../core/application/SimpleFlowController'

/**
 * Warnsystem für intubierte Patienten
 * 
 * State Machine basierend auf Anforderungsbeschreibung:
 * 1. Begrüßungstext (TTS) → 2. Glocke aktiv → 3. Glocke spielt → 4. Zurück-Button aktiv
 * 
 * Zyklus: Glocke ↔ Zurück-Button wiederholt sich
 */

export function useWarningViewLogic() {
  const router = useRouter()
  const settingsStore = useSettingsStore()

  // ===== BLINK INPUT =====
  const { setupEventListeners, startIntroduction, endIntroduction } = useBlinkInput()

  // ===== STATE MACHINE =====
  enum WarningState {
    GREETING = 'greeting',           // Schritt 1: Begrüßungstext
    BELL_IDLE = 'bell_idle',        // Schritt 2: Glocke aktiv (wartet auf Start)
    BELL_PLAYING = 'bell_playing',  // Schritt 3: Glocke spielt Warnton
    BACK_ACTIVE = 'back_active'     // Schritt 4: Zurück-Button aktiv
  }

  // ===== STATE VARIABLES =====
  const currentState = ref<WarningState>(WarningState.GREETING)
  const statusText = ref("Warnsystem wird gestartet...")
  const isTTSActive = ref(false)
  
  // ===== CONSTANTS =====
  const LOOP_INTERVAL = 4000 // 4 Sekunden für konsistente UX
  
  // ===== MOBILE DETECTION =====
  const isMobile = () => {
    return window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  }

  // ===== TTS IMPLEMENTATION =====
  const speakText = (text: string, onStart?: () => void, onEnd?: () => void): Promise<void> => {
    return new Promise((resolve) => {
      console.log('TTS: Speaking:', text)
      
      // ✅ Prüfe ob TTS stumm geschaltet ist → Volume 0 setzen
      const isMuted = simpleFlowController.getTTSMuted()
      if (isMuted) {
        console.log('WarningView: TTS is muted - setting volume to 0')
      }
      
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'de-DE'
      utterance.rate = 0.8
      utterance.pitch = 1.0
      utterance.volume = isMuted ? 0 : 0.8  // ✅ Volume basierend auf Mute-Status

      let resolved = false
      const finish = () => {
        if (!resolved) {
          resolved = true
          isTTSActive.value = false
          resolve()
        }
      }

      utterance.onstart = () => {
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
        finish()
      }

      // Sicherheitsfallback nach 10s
      setTimeout(finish, 10000)

      speechSynthesis.speak(utterance)
    })
  }

  const delay = (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // ===== TIMER MANAGEMENT =====
  let timers: number[] = []
  
  const clearTimers = () => {
    timers.forEach(t => clearTimeout(t))
    timers = []
  }
  
  const setTimer = (callback: () => void, delay: number): void => {
    const id = window.setTimeout(callback, delay)
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
      
      // Alarm-Ton: 1000Hz + 1200Hz für Alarm-Effekt
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
    
    // Sofort einen Alarm abspielen
    playAlarmSound()
    
    // Dann alle 0.5 Sekunden wiederholen
    alarmInterval.value = window.setInterval(() => {
      if (isAlarmActive.value) {
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

  // ===== STATE MACHINE LOGIC =====
  
  // Zentrale Transition-Funktion
  const transitionTo = (newState: WarningState) => {
    console.log(`Transitioning from ${currentState.value} to ${newState}`)
    clearTimers()
    currentState.value = newState

    switch (newState) {
      case WarningState.GREETING:
        return startGreeting()
      case WarningState.BELL_IDLE:
        return startBellIdle()
      case WarningState.BELL_PLAYING:
        return startBellPlaying()
      case WarningState.BACK_ACTIVE:
        return startBackActive()
    }
  }
  
  // Schritt 1: Begrüßungstext
  const startGreeting = async () => {
    console.log('State: GREETING - Starting greeting')
    startIntroduction() // Einführung aktiv - Input ignorieren
    
    // Text basierend auf Gerätetyp anpassen
    if (isMobile()) {
      statusText.value = "Blinzeln oder Tippen um ein Warngeräusch auszulösen."
    } else {
      statusText.value = "Blinzeln Sie oder tippen Sie, um ein Warngeräusch auszulösen. Blinzeln oder tippen Sie erneut, um das Warngeräusch zu stoppen."
    }
    
    try {
      await speakText(
        statusText.value,
        () => {
          console.log('Greeting TTS started')
        },
        () => {
          console.log('Greeting TTS finished')
        }
      )
    } catch (ttsError) {
      console.warn('TTS nicht verfügbar, überspringe Begrüßung:', ttsError)
      await delay(3000) // Warte 3 Sekunden wie bei TTS
    }
    
    // Nach Begrüßung → Schritt 2
    endIntroduction() // Einführung beendet - Input wieder erlaubt
    transitionTo(WarningState.BELL_IDLE)
  }

  // Schritt 2: Glocke aktiv (wartet auf Start)
  const startBellIdle = async () => {
    console.log('State: BELL_IDLE - Bell ready for activation')
    statusText.value = "Warngeräusch abspielen."
    
    try {
      await speakText(
        statusText.value,
        () => {
          console.log('Bell idle TTS started')
        },
        () => {
          console.log('Bell idle TTS finished')
        }
      )
    } catch (ttsError) {
      console.warn('TTS Fehler bei Bell idle:', ttsError)
      await delay(2000)
    }
    
    // Auto-Mode: Nach 4 Sekunden → automatisch zu Zurück-Button (Loop startet)
    // Nur wenn kein Warngesräusch läuft
    if (!isAlarmActive.value) {
      console.log('Setting timer for 4 seconds to go to back button')
      setTimer(() => {
        console.log('Bell timer fired! Current state:', currentState.value)
        if (currentState.value === WarningState.BELL_IDLE && !isAlarmActive.value) {
          console.log('No interaction after 4 seconds - starting loop with back button')
          transitionTo(WarningState.BACK_ACTIVE)
        } else {
          console.log('Bell state changed during timer or alarm active, not switching to back button')
        }
      }, LOOP_INTERVAL)
    } else {
      console.log('Auto-Mode übersprungen - Warngesräusch läuft bereits')
    }
  }

  // Schritt 3: Glocke spielt Warnton
  const startBellPlaying = () => {
    console.log('State: BELL_PLAYING - Alarm is playing')
    statusText.value = "Warngeräusch läuft..."
    startContinuousAlarm()
    
    // WICHTIG: Kein Auto-Mode während Warngesräusch läuft!
    // Der Durchlauf wird gestoppt, bis das Warngesräusch deaktiviert wird
    console.log('Auto-Mode gestoppt während Warngesräusch läuft')
  }

  // Schritt 4: Zurück-Button aktiv
  const startBackActive = async () => {
    console.log('State: BACK_ACTIVE - Back button ready')
    statusText.value = "Zurück zum Hauptmenü."
    
    try {
      await speakText(
        statusText.value,
        () => {
          console.log('Back button TTS started')
        },
        () => {
          console.log('Back button TTS finished')
        }
      )
    } catch (ttsError) {
      console.warn('TTS Fehler bei Back button:', ttsError)
      await delay(2000)
    }
    
    // Auto-Mode: Nach 4 Sekunden → zurück zu Glocke (Loop fortsetzen)
    // Nur wenn kein Warngesräusch läuft
    if (!isAlarmActive.value) {
      console.log('Setting timer for 4 seconds to go back to bell')
      setTimer(() => {
        console.log('Back button timer fired! Current state:', currentState.value)
        if (currentState.value === WarningState.BACK_ACTIVE && !isAlarmActive.value) {
          console.log('Loop continuing - back to bell')
          transitionTo(WarningState.BELL_IDLE)
        } else {
          console.log('State changed during back button timer or alarm active, not switching to bell')
        }
      }, LOOP_INTERVAL)
    } else {
      console.log('Auto-Mode übersprungen - Warngesräusch läuft bereits')
    }
  }

  // ===== USER INTERACTION =====
  const handleUserInput = async () => {
    console.log('User input detected in state:', currentState.value)
    
    // Nur für aktive States reagieren
    if (currentState.value === WarningState.GREETING) {
      console.log('User input ignored during greeting state')
      return
    }
    
    // Stoppe alle Timer und TTS
    clearTimers()
    speechSynthesis.cancel()
    
    switch (currentState.value) {
      case WarningState.BELL_IDLE:
        // Erster Blinzler/Klick: Startet Warngeräusch
        console.log('Bell activated - starting alarm')
        // Stoppe alle Timer (Auto-Mode wird gestoppt)
        clearTimers()
        transitionTo(WarningState.BELL_PLAYING)
        break
        
      case WarningState.BELL_PLAYING:
        // Zweiter Blinzler/Klick: Stoppt Warngeräusch
        console.log('Bell deactivated - stopping alarm')
        stopContinuousAlarm()
        // 2 Sekunden Pause nach Stoppen des Warngesräuschs
        console.log('Waiting 2 seconds before resuming auto-mode')
        setTimer(() => {
          console.log('Pause finished - resuming auto-mode')
          transitionTo(WarningState.BACK_ACTIVE)
        }, 2000)
        break
        
      case WarningState.BACK_ACTIVE:
        // Navigation zurück zum Hauptmenü
        console.log('Back button activated - navigating to home')
        stopContinuousAlarm()
        router.push('/app')
        break
        
      default:
        console.log('User input ignored in state:', currentState.value)
    }
  }

  // ===== LIFECYCLE =====
  const start = async () => {
    console.log('WarningView: Starting warning system')
    await startGreeting()
  }

  const cleanup = () => {
    console.log('WarningView: Cleaning up')
    clearTimers()
    speechSynthesis.cancel()
    stopContinuousAlarm()
    
    // AudioContext schließen
    if (audioContext.value) {
      audioContext.value.close()
      audioContext.value = null
    }
  }

  // ===== TOUCH EVENT HANDLERS =====
  const handleTouchStart = (event: TouchEvent) => {
    // Nur Touch-Events für aktive States verarbeiten
    const target = event.target as HTMLElement
    const bellButton = target.closest('.bell-button')
    const backButton = target.closest('.back-action-button')
    
    if (bellButton && (currentState.value === WarningState.BELL_IDLE || currentState.value === WarningState.BELL_PLAYING)) {
      console.log('WarningView: Touch start on active bell button')
      // Touch-Events werden normal verarbeitet
    } else if (backButton && currentState.value === WarningState.BACK_ACTIVE) {
      console.log('WarningView: Touch start on active back button')
      // Touch-Events werden normal verarbeitet
    } else {
      console.log('WarningView: Touch start on inactive element - ignoring')
      event.preventDefault()
      event.stopPropagation()
    }
  }

  const handleTouchEnd = (event: TouchEvent) => {
    // Nur Touch-Events für aktive States verarbeiten
    const target = event.target as HTMLElement
    const bellButton = target.closest('.bell-button')
    const backButton = target.closest('.back-action-button')
    
    if (bellButton && (currentState.value === WarningState.BELL_IDLE || currentState.value === WarningState.BELL_PLAYING)) {
      console.log('WarningView: Touch end on active bell button')
      handleUserInput()
    } else if (backButton && currentState.value === WarningState.BACK_ACTIVE) {
      console.log('WarningView: Touch end on active back button')
      handleUserInput()
    } else {
      console.log('WarningView: Touch end on inactive element - ignoring')
      event.preventDefault()
      event.stopPropagation()
    }
  }

  // Event Listener Setup (wird von Vue-Komponente aufgerufen)
  const setupWarningSystem = async () => {
    console.log('WarningView: Setting up warning system')
    
    // Event Listener für Blink- und Klick-Erkennung einrichten
    const cleanupEventListeners = setupEventListeners(handleUserInput)
    
    // Touch Event Listener hinzufügen
    document.addEventListener('touchstart', handleTouchStart, { passive: false })
    document.addEventListener('touchend', handleTouchEnd, { passive: false })
    
    // Direkt starten
    await start()
    
    // Cleanup-Funktion zurückgeben
    return () => {
      cleanupEventListeners()
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }

  return {
    // State
    currentState,
    statusText,
    isTTSActive,
    isAlarmActive,
    
    // Methods
    handleUserInput,
    setupWarningSystem,
    cleanup,
    
    // Stores
    settingsStore
  }
}
