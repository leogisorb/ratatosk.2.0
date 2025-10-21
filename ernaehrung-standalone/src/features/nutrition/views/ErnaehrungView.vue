<template>
  <div class="ernaehrung-app">
    <!-- App Header -->
    <AppHeader />

    <!-- Main Content -->
    <main class="main-content">
      <div class="content-wrapper">
        <!-- Haupttext -->
        <div class="main-text-container">
          <h1 class="main-text" role="heading" aria-level="1">
            Was wollen Sie zu sich nehmen?
          </h1>
        </div>

        <!-- Feedback-Text -->
        <div class="feedback-text-container">
          <div 
            class="feedback-text" 
            :class="{ show: feedbackText && feedbackText.length > 0 }"
            role="status"
            aria-live="polite"
            aria-label="Auswahlbestätigung"
          >
            {{ feedbackText }}
          </div>
        </div>

        <!-- Sliding Karussell -->
        <div class="carousel-container" role="region" aria-label="Ernährungsauswahl">
          <div class="carousel-track" role="list" aria-label="Verfügbare Ernährungsoptionen">
            <div 
              v-for="(item, index) in ernaehrungItems"
              :key="item.id"
              class="carousel-item"
              :class="getPositionClass(index)"
              :style="getItemStyle(index)"
              role="listitem"
              :tabindex="activeIndex === index ? 0 : -1"
              :aria-label="getAriaLabel(item, index)"
              :aria-selected="activeIndex === index"
              @click="selectItem(item.id)"
              @keydown.enter="selectItem(item.id)"
              @keydown.space.prevent="selectItem(item.id)"
            >
              <div class="carousel-item-content">
                <div class="tile-icon-container">
                  <div class="tile-emoji">{{ item.emoji }}</div>
                </div>
                <div class="tile-text">{{ item.text }}</div>
                <div v-if="item.description" class="tile-description">
                  {{ item.description }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Indikatoren -->
    <div class="indicators-container" role="navigation" aria-label="Karussell-Navigation">
      <div class="carousel-indicators" role="tablist" aria-label="Ernährungsoptionen">
        <button 
          v-for="(item, index) in ernaehrungItems"
          :key="`indicator-${item.id}`"
          class="carousel-indicator"
          :class="{ active: activeIndex === index }"
          role="tab"
          :aria-selected="activeIndex === index"
          :aria-label="`Gehe zu ${item.text}, ${index + 1} von ${ernaehrungItems.length}`"
          @click="goToIndex(index)"
          :title="`${item.text} - ${index + 1} von ${ernaehrungItems.length}`"
        />
      </div>
    </div>

    <!-- TTS-Indikator -->
    <div 
      class="tts-indicator" 
      :class="{ active: isTTSActive }"
      role="status"
      aria-live="polite"
      :aria-label="isTTSActive ? 'Text wird vorgelesen' : 'Text-zu-Sprache inaktiv'"
    >
      🔊
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '../../../shared/components/AppHeader.vue'
import { useCarousel, type CarouselItem } from '../composables/useCarousel'
import { useTTS } from '../composables/useTTS'
import { useFaceRecognition } from '../../face-recognition/composables/useFaceRecognition'
import { useSettingsStore } from '../../settings/stores/settings'
import { simpleFlowController } from '../../../core/application/SimpleFlowController'
import { generateTTSText, getMainText, getPauseAfterTTS, getAutoStartDelay, getCycleDelay } from '../../../config/ttsConfig'

// Router
const router = useRouter()

// Stores
const settingsStore = useSettingsStore()

// Face Recognition
const faceRecognition = useFaceRecognition()

// State
const feedbackText = ref('')

// Ernährungs-Items
const ernaehrungItems = ref<CarouselItem[]>([
  { id: 'essen', text: 'Essen', emoji: '🍽️', description: 'Feste Nahrung', type: 'kategorie' },
  { id: 'trinken', text: 'Trinken', emoji: '🥤', description: 'Flüssigkeiten', type: 'kategorie' },
  { id: 'suess', text: 'süß', emoji: '🍰', description: 'Zuckerhaltig', type: 'geschmack' },
  { id: 'herzhaft', text: 'herzhaft', emoji: '🍔', description: 'Würzig', type: 'geschmack' },
  { id: 'scharf', text: 'scharf', emoji: '🌶️', description: 'Würzig', type: 'geschmack' },
  { id: 'sauer', text: 'sauer', emoji: '🍋', description: 'Säuerlich', type: 'geschmack' },
  { id: 'kalt', text: 'kalt', emoji: '❄️', description: 'Gekühlt', type: 'temperatur' },
  { id: 'warm', text: 'warm', emoji: '🔥', description: 'Erhitzt', type: 'temperatur' },
  { id: 'lauwarm', text: 'lauwarm', emoji: '🌡️', description: 'Zimmertemperatur', type: 'temperatur' },
  { id: 'trocken', text: 'trocken', emoji: '🍪', description: 'Fest', type: 'konsistenz' },
  { id: 'nass', text: 'nass', emoji: '💧', description: 'Flüssig', type: 'konsistenz' },
  { id: 'breiig', text: 'breiig', emoji: '🥣', description: 'Weich', type: 'konsistenz' },
  { id: 'wasser', text: 'Wasser', emoji: '💧', description: 'Still oder Sprudel', type: 'getraenk' },
  { id: 'saft', text: 'Saft', emoji: '🧃', description: 'Fruchtsaft', type: 'getraenk' },
  { id: 'milch', text: 'Milch', emoji: '🥛', description: 'Kuhmilch', type: 'getraenk' },
  { id: 'tee', text: 'Tee', emoji: '🍵', description: 'Heißer Tee', type: 'getraenk' },
  { id: 'zurueck', text: 'zurück', emoji: '⬅️', description: 'Zurück zur Hauptseite', type: 'navigation' }
])

// Composables
const {
  activeIndex,
  currentItem,
  isTransitioning,
  userInteracted,
  getPositionClass,
  navigate,
  goToIndex,
  startAutoMode,
  stopAutoMode
} = useCarousel(ernaehrungItems)

const {
  isTTSActive,
  isTTSEnabled,
  speak: speakFromComposable,
  stopTTS,
  enableTTS,
  handleKeydown
} = useTTS()

// Direkte TTS-Funktion für bessere Kontrolle
const speak = async (text: string) => {
  if (!text?.trim() || isTTSActive.value) return
  
  try {
    isTTSActive.value = true
    console.log('ErnaehrungView: Speaking:', text)
    await simpleFlowController.speak(text)
  } catch (error) {
    console.error('ErnaehrungView: TTS Error:', error)
    // Fallback: Visuelles Feedback
    feedbackText.value = `TTS Fehler: ${text}`
    setTimeout(() => {
      feedbackText.value = ''
    }, 3000)
  } finally {
    isTTSActive.value = false
  }
}

// Accessibility
const getAriaLabel = (item: CarouselItem, index: number) => {
  const isActive = activeIndex.value === index
  const position = `${index + 1} von ${ernaehrungItems.value.length}`
  return `${item.text}, ${item.description || ''}, ${position}${isActive ? ', aktuell ausgewählt' : ''}`
}

// Sliding Karussell - Position und Style berechnen
const getItemStyle = (index: number) => {
  const total = ernaehrungItems.value.length
  const current = activeIndex.value
  
  // Berechne relative Position zum aktuellen Index
  let relativeIndex = index - current
  
  // Handle Looping
  if (relativeIndex > total / 2) {
    relativeIndex -= total
  } else if (relativeIndex < -total / 2) {
    relativeIndex += total
  }
  
  // Position berechnen (von rechts nach links)
  const itemWidth = 280 // Breite einer Kachel
  const spacing = 80 // Mehr Abstand zwischen Kacheln
  const translateX = relativeIndex * (itemWidth + spacing)
  
  // Bessere Opacity-Berechnung
  let opacity = 0.2
  if (relativeIndex === 0) opacity = 1.0 // Aktive Kachel
  else if (Math.abs(relativeIndex) === 1) opacity = 0.7 // Nachbar-Kacheln
  else if (Math.abs(relativeIndex) === 2) opacity = 0.4 // Weitere Kacheln
  else if (Math.abs(relativeIndex) <= 3) opacity = 0.2 // Entfernte Kacheln
  
  return {
    transform: `translateX(${translateX}px)`,
    zIndex: relativeIndex === 0 ? 3 : Math.abs(relativeIndex) === 1 ? 2 : 1,
    opacity: opacity
  }
}

// Item-Auswahl
const selectItem = async (itemId: string) => {
  if (isTTSActive.value || isTransitioning.value) return

  const item = ernaehrungItems.value.find(i => i.id === itemId)
  if (!item) return

  // Navigation stoppen
  stopAutoMode()

  if (itemId === 'zurueck') {
    router.push('/ich')
    return
  }

  try {
    // TTS-Text generieren
    const ttsText = generateTTSText('ernaehrung', item.text)
    
    // Visuelles Feedback
    feedbackText.value = ttsText
    
    // TTS abspielen
    await speak(ttsText)
    
    // Pause nach TTS
    const pauseAfterTTS = getPauseAfterTTS('ernaehrung')
    await new Promise(resolve => setTimeout(resolve, pauseAfterTTS + 2000))
    
    // Zurück zur Hauptseite
    router.push('/ich')
  } catch (error) {
    console.error('Selection error:', error)
    feedbackText.value = `Fehler: ${item.text}`
    setTimeout(() => {
      feedbackText.value = ''
    }, 3000)
  }
}

// Keyboard Handler
const onKeydown = (event: KeyboardEvent) => {
  handleKeydown(event, () => selectItem(currentItem.value.id), navigate)
}

// Face Recognition Handler
const handleFaceBlink = (event: any) => {
  try {
    if (isTTSActive.value) return
    
    const current = currentItem.value
    if (current) {
      selectItem(current.id)
    }
  } catch (error) {
    console.error('Face blink error:', error)
  }
}

// Right Click Handler
const handleRightClick = (event: MouseEvent) => {
  if (isTTSActive.value) {
    event.preventDefault()
    return false
  }

  event.preventDefault()
  event.stopPropagation()
  event.stopImmediatePropagation()
  
  const current = currentItem.value
  if (current) {
    selectItem(current.id)
  }
  return false
}

// Lifecycle
onMounted(async () => {
  // Flow Controller
  simpleFlowController.setActiveView('/ernaehrung')
  
  // Face Recognition
  if (!faceRecognition.isActive.value) {
    faceRecognition.start()
  }
  
  // Event Listeners
  document.addEventListener('keydown', onKeydown)
  document.addEventListener('click', enableTTS)
  document.addEventListener('touchstart', enableTTS)
  document.addEventListener('contextmenu', handleRightClick, { capture: true, passive: false })
  window.addEventListener('faceBlinkDetected', handleFaceBlink)
  
  // TTS sofort aktivieren
  enableTTS()
  
  // SimpleFlowController User-Interaktion setzen
  simpleFlowController.setUserInteracted(true)
  
  // Auto-Mode starten - auch ohne TTS
  const mainText = getMainText('ernaehrung')
  const autoStartDelay = getAutoStartDelay('ernaehrung')
  const cycleDelay = getCycleDelay('ernaehrung')
  
  setTimeout(async () => {
    try {
      // Versuche TTS, aber starte Auto-Mode auch wenn es fehlschlägt
      try {
        await speak(mainText)
        const pauseAfterTTS = getPauseAfterTTS('ernaehrung')
        await new Promise(resolve => setTimeout(resolve, pauseAfterTTS))
      } catch (ttsError) {
        console.warn('TTS failed, continuing without audio:', ttsError)
        // Zeige visuelles Feedback statt TTS
        feedbackText.value = mainText
        setTimeout(() => {
          feedbackText.value = ''
        }, 3000)
      }
      
      // Starte Auto-Mode unabhängig von TTS
      if (!userInteracted.value) {
        console.log('ErnaehrungView: Starting auto-mode')
        startAutoMode(cycleDelay)
      } else {
        // Fallback: Starte Auto-Mode auch wenn User interagiert hat
        console.log('ErnaehrungView: Starting auto-mode (fallback)')
        startAutoMode(cycleDelay)
      }
    } catch (error) {
      console.error('Auto-mode error:', error)
      // Fallback: Starte Auto-Mode trotzdem
      console.log('ErnaehrungView: Starting auto-mode (error fallback)')
      startAutoMode(cycleDelay)
    }
  }, autoStartDelay)
})

onUnmounted(() => {
  // Cleanup
  stopAutoMode()
  stopTTS()
  
  // Event Listeners entfernen
  document.removeEventListener('keydown', onKeydown)
  document.removeEventListener('click', enableTTS)
  document.removeEventListener('touchstart', enableTTS)
  document.removeEventListener('contextmenu', handleRightClick, { capture: true })
  window.removeEventListener('faceBlinkDetected', handleFaceBlink)
  
  // Face Recognition stoppen
  faceRecognition.stop()
})
</script>

<style scoped>
@import './ErnaehrungView.css';
</style>