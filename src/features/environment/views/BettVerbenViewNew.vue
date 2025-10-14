<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useFaceRecognition } from '../../face-recognition/composables/useFaceRecognition'
import { useSettingsStore } from '../../settings/stores/settings'
import AppHeader from '../../../shared/components/AppHeader.vue'

// Router
const router = useRouter()
const route = useRoute()

// Stores
const settingsStore = useSettingsStore()

// Face Recognition
const faceRecognition = useFaceRecognition()

// State
const currentTileIndex = ref(0)
const selectedVerb = ref('')
const selectedBettItem = ref('')
const isAutoMode = ref(true)
const autoModeInterval = ref<number | null>(null)
const closedFrames = ref(0)
const eyesClosed = ref(false)

// Verbesserte Blink-Detection Parameter
const blinkThreshold = computed(() => Math.ceil(settingsStore.settings.blinkSensitivity * 10))
const lastBlinkTime = ref(0)
const blinkCooldown = computed(() => settingsStore.settings.blinkSensitivity * 1000)

// Text-to-Speech
const speechSynthesis = window.speechSynthesis
const isTTSEnabled = ref(true)

// Bett-Verben-Items mit passenden Emojis (max 10 Verben + Zurück = 11 total)
const bettVerbenItems = [
  { id: 'nehmen', text: 'nehmen', type: 'verb', emoji: '✋' },
  { id: 'geben', text: 'geben', type: 'verb', emoji: '🤲' },
  { id: 'holen', text: 'holen', type: 'verb', emoji: '🏃' },
  { id: 'legen', text: 'legen', type: 'verb', emoji: '📦' },
  { id: 'auflegen', text: 'auflegen', type: 'verb', emoji: '⬆️' },
  { id: 'zudecken', text: 'zudecken', type: 'verb', emoji: '🛌' },
  { id: 'abdecken', text: 'abdecken', type: 'verb', emoji: '🔄' },
  { id: 'waschen', text: 'waschen', type: 'verb', emoji: '🧽' },
  { id: 'aufräumen', text: 'aufräumen', type: 'verb', emoji: '🧹' },
  { id: 'wegräumen', text: 'wegräumen', type: 'verb', emoji: '📤' },
  { id: 'zurück', text: 'zurück', type: 'navigation', emoji: '↩️' }
]

// Auto-Mode Funktionen
const startAutoMode = () => {
  if (!isAutoMode.value) return
  
  console.log('BettVerbenView: Starting auto-mode with', bettVerbenItems.length, 'items')
  
  autoModeInterval.value = window.setInterval(() => {
    currentTileIndex.value = (currentTileIndex.value + 1) % bettVerbenItems.length
    const currentItem = bettVerbenItems[currentTileIndex.value]
    console.log('BettVerbenView: Auto-mode cycle:', currentItem.text, 'at index:', currentTileIndex.value)
    speakText(currentItem.text)
  }, 3000)
}

const stopAutoMode = () => {
  if (autoModeInterval.value) {
    clearInterval(autoModeInterval.value)
    autoModeInterval.value = null
    console.log('BettVerbenView: Auto-mode stopped')
  }
}

// TTS Funktionen
const speakText = (text: string) => {
  if (!isTTSEnabled.value || !speechSynthesis) return
  
  console.log('BettVerbenView: Speaking:', text)
  
  // Stoppe vorherige TTS
  speechSynthesis.cancel()
  
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'de-DE'
  utterance.rate = 0.8
  utterance.pitch = 1.0
  utterance.volume = 0.8
  
  // Wähle deutsche Stimme
  const voices = speechSynthesis.getVoices()
  if (voices.length > 0) {
    const germanVoice = voices.find(voice => 
      voice.lang.startsWith('de') && voice.name.includes('Anna')
    ) || voices.find(voice => voice.lang.startsWith('de'))
    
    if (germanVoice) {
      utterance.voice = germanVoice
    }
  }
  
  speechSynthesis.speak(utterance)
}

// Verb-Auswahl
const selectVerb = (verbId: string) => {
  const verb = bettVerbenItems.find(item => item.id === verbId)
  if (!verb) return
  
  console.log('BettVerbenView: Verb selected:', verb.text)
  
  if (verbId === 'zurück') {
    // Zurück zur Bett-View
    router.push('/bett')
  } else {
    selectedVerb.value = verb.text
    speakText(`${selectedBettItem.value} ${verb.text}`)
    
    // Nach 3 Sekunden zurück zur Bett-View
    setTimeout(() => {
      router.push('/bett')
    }, 3000)
  }
}

// Blink Detection
const handleFaceBlink = () => {
  const now = Date.now()
  
  if (faceRecognition.isBlinking()) {
    closedFrames.value++
    
    if (now - lastBlinkTime.value < blinkCooldown.value) {
      return
    }
    
    if (closedFrames.value >= blinkThreshold.value && !eyesClosed.value) {
      const currentItem = bettVerbenItems[currentTileIndex.value]
      
      speakText(currentItem.text)
      selectVerb(currentItem.id)
      eyesClosed.value = true
      lastBlinkTime.value = now
      closedFrames.value = 0
    }
  } else {
    if (closedFrames.value > 0) {
      closedFrames.value = 0
      eyesClosed.value = false
    }
  }
}

// Rechte Maustaste als Blinzeln-Ersatz
const handleRightClick = (event: MouseEvent) => {
  event.preventDefault()
  event.stopPropagation()
  event.stopImmediatePropagation()
  console.log('BettVerbenView: Right click detected! Current tile index:', currentTileIndex.value, 'Items length:', bettVerbenItems.length)
  const currentItem = bettVerbenItems[currentTileIndex.value]
  if (currentItem) {
    console.log('BettVerbenView: Right click activation for item:', currentItem.text)
    speakText(currentItem.text)
    selectVerb(currentItem.id)
  } else {
    console.log('BettVerbenView: No current item found for right click')
  }
  return false
}

// Lifecycle
onMounted(() => {
  // Hole den Bett-Gegenstand aus der Route und konvertiere Umlaute
  const itemId = route.params.bettItem as string || 'Bett-Item'
  
  // Konvertiere URL-Parameter zu korrekten deutschen Umlauten
  const umlautMap: { [key: string]: string } = {
    'decke': 'Decke',
    'kissen': 'Kissen',
    'bettlaken': 'Bettlaken',
    'bettzeug': 'Bettzeug',
    'matratze': 'Matratze'
  }
  
  selectedBettItem.value = umlautMap[itemId] || itemId
  
  if (!faceRecognition.isActive.value) {
    faceRecognition.start()
  }
  
  startAutoMode()
  
  const blinkCheckInterval = setInterval(() => {
    handleFaceBlink()
  }, 100)
  
  console.log('BettVerbenView: Registering right-click handler')
  document.addEventListener('contextmenu', handleRightClick, { capture: true, passive: false })
})

onUnmounted(() => {
  document.removeEventListener('contextmenu', handleRightClick, { capture: true })
  stopAutoMode()
})
</script>

<template>
  <div class="bett-verben-app">
    <!-- App Header -->
    <AppHeader />

    <!-- Main Content - Zentriert -->
    <main class="main-content">
      <div class="content-wrapper">
        <!-- Ausgewähltes Verb-Item Anzeige -->
        <div class="selected-item-container">
          <div class="selected-item-text" style="font-size: 3.43rem; font-family: 'Source Code Pro', monospace; font-weight: 500;">
            {{ selectedBettItem }}{{ selectedVerb ? ' ' + selectedVerb : '' }}
          </div>
        </div>

        <!-- Bett-Verben-Items Grid - 2x5 Grid für 10 Items -->
        <div class="bett-verben-items-grid">
          <button
            v-for="(item, index) in bettVerbenItems"
            :key="item.id"
            @click="selectVerb(item.id)"
            class="bett-verben-items-item"
            :class="currentTileIndex === index ? 'active' : 'inactive'"
          >
            <div v-if="item.emoji" class="bett-verben-items-emoji">{{ item.emoji }}</div>
            <span class="bett-verben-items-text">{{ item.text }}</span>
          </button>
        </div>

      </div>
    </main>
  </div>
</template>

<style scoped>
@import './BettVerbenView.css';
</style>
