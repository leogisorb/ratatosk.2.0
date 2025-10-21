import { ref, onMounted, onUnmounted } from 'vue'
import { simpleFlowController } from '../../../core/application/SimpleFlowController'

export function useTTS() {
  const isTTSActive = ref(false)
  const isTTSEnabled = ref(false)
  const lastSpokenText = ref('')

  // TTS mit Error Handling
  const speak = async (text: string): Promise<void> => {
    if (!text?.trim() || isTTSActive.value) return
    
    try {
      isTTSActive.value = true
      lastSpokenText.value = text
      
      await simpleFlowController.speak(text)
    } catch (error) {
      console.error('TTS Error:', error)
      // Fallback: Visuelles Feedback
      throw new Error(`TTS failed: ${error}`)
    } finally {
      isTTSActive.value = false
    }
  }

  // TTS stoppen
  const stopTTS = () => {
    simpleFlowController.stopTTS()
    isTTSActive.value = false
  }

  // TTS aktivieren nach User-Interaktion
  const enableTTS = () => {
    isTTSEnabled.value = true
  }

  // Keyboard Event Handler
  const handleKeydown = (event: KeyboardEvent, onSelect: () => void, onNavigate: (direction: 'next' | 'prev') => void) => {
    if (!isTTSEnabled.value) return

    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault()
        onNavigate('prev')
        break
      case 'ArrowRight':
        event.preventDefault()
        onNavigate('next')
        break
      case 'Enter':
      case ' ':
        event.preventDefault()
        onSelect()
        break
      case 'Escape':
        event.preventDefault()
        stopTTS()
        break
    }
  }

  // Cleanup
  onUnmounted(() => {
    stopTTS()
  })

  return {
    isTTSActive,
    isTTSEnabled,
    lastSpokenText,
    speak,
    stopTTS,
    enableTTS,
    handleKeydown
  }
}

