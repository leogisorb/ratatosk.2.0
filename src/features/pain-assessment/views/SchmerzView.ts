import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePainAssessment } from '../composables/usePainAssessment'
import { mainRegions } from '../data/painAssessmentData'

export function useSchmerzViewLogic() {
  // Router
  const router = useRouter()

  // Use centralized pain assessment logic
  const {
    currentTileIndex,
    isAutoMode,
    autoModeInterval,
    closedFrames,
    eyesClosed,
    isAutoModePaused,
    blinkThreshold,
    lastBlinkTime,
    blinkCooldown,
    speechSynthesis,
    isTTSEnabled,
    speakText,
    startAutoMode,
    pauseAutoMode,
    stopAutoMode,
    navigateBack,
    setupLifecycle,
    settingsStore,
    faceRecognition
  } = usePainAssessment()

  // Schmerz-Items with body parts - 3x2 Grid like Ich-View
  const schmerzItems = [
    {
      id: 'kopf',
      title: 'KOPF',
      description: 'Kopfschmerzen dokumentieren',
      icon: '/ratatosk.2.0/head.png'
    },
    {
      id: 'beine',
      title: 'BEINE',
      description: 'Beinschmerzen dokumentieren',
      icon: '/ratatosk.2.0/leg.png'
    },
    {
      id: 'arme',
      title: 'ARME',
      description: 'Armschmerzen dokumentieren',
      icon: '/ratatosk.2.0/elbow-2.png'
    },
    {
      id: 'torso',
      title: 'TORSO',
      description: 'Torsoschmerzen dokumentieren',
      icon: '/ratatosk.2.0/living.png'
    },
    {
      id: 'zurueck',
      title: 'ZURÜCK',
      description: 'Zurück zur Hauptansicht',
      icon: '/ratatosk.2.0/Goback.svg'
    }
  ]

  // Schmerz-Item selection
  function selectSchmerz(schmerzId: string) {
    console.log('selectSchmerz called with schmerzId:', schmerzId)
    pauseAutoMode()
    
    const selectedItem = schmerzItems.find(item => item.id === schmerzId)
    if (selectedItem) {
      speakText(`${selectedItem.title} ausgewählt`)
    }
    
    switch (schmerzId) {
      case 'zurueck':
        console.log('Navigating back to main menu')
        stopAutoMode()
        navigateBack('/app')
        break
      case 'kopf':
      case 'beine':
      case 'arme':
      case 'torso':
        console.log('Navigating to PainDialogView for:', schmerzId)
        stopAutoMode()
        // Navigate to the new unified pain dialog
        router.push('/pain-dialog')
        break
      default:
        console.log('Selected Schmerz:', schmerzId)
        
        // Restart auto-mode after 10 seconds
        setTimeout(() => {
          if (isAutoMode.value) {
            currentTileIndex.value = 0
            isAutoModePaused.value = false
            startAutoMode(schmerzItems, 1000, 3000)
          }
        }, 10000)
    }
  }

  // Selection handler for centralized logic
  const handleSelection = (item: any) => {
    selectSchmerz(item.id)
  }

  // Lifecycle
  let cleanup: (() => void) | null = null

  onMounted(() => {
    // Setup lifecycle with centralized logic
    cleanup = setupLifecycle(schmerzItems, handleSelection)
  })

  onUnmounted(() => {
    if (cleanup) {
      cleanup()
    }
  })

  return {
    currentTileIndex,
    isAutoMode,
    autoModeInterval,
    closedFrames,
    eyesClosed,
    isAutoModePaused,
    blinkThreshold,
    lastBlinkTime,
    blinkCooldown,
    speechSynthesis,
    isTTSEnabled,
    schmerzItems,
    speakText,
    startAutoMode,
    pauseAutoMode,
    stopAutoMode,
    selectSchmerz,
    settingsStore,
    faceRecognition
  }
}
