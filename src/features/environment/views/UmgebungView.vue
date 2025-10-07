<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSettingsStore } from '../../settings/stores/settings'
import { useFaceRecognition } from '../../face-recognition/composables/useFaceRecognition'
import GlobalHeader from '../../../shared/components/GlobalHeader.vue'

// Router
const router = useRouter()

// Stores
const settingsStore = useSettingsStore()

// Face Recognition
const faceRecognition = useFaceRecognition()

// State
const currentTileIndex = ref(0)
const isAutoMode = ref(true)
const autoModeInterval = ref<number | null>(null)
const closedFrames = ref(0)
const eyesClosed = ref(false)
const isAutoModePaused = ref(false)

// Blink Detection Parameter
const blinkThreshold = computed(() => Math.ceil(settingsStore.settings.blinkSensitivity * 10))
const lastBlinkTime = ref(0)
const blinkCooldown = computed(() => settingsStore.settings.blinkSensitivity * 1000)

// Text-to-Speech
const speechSynthesis = window.speechSynthesis
const isTTSEnabled = ref(true)

// Umgebung-Items
const umgebungItems = [
  { id: 'bett', title: 'BETT', icon: 'sleeping.png' },
  { id: 'zimmer', title: 'ZIMMER', icon: 'living.png' },
  { id: 'gegenstaende', title: 'GEGENSTÄNDE', icon: 'eyeglasses.png' },
  { id: 'zurueck', title: 'ZURÜCK', icon: 'Goback.svg' }
]

// Aktiver Menüpunkt
const activeItemId = computed(() => umgebungItems[currentTileIndex.value].id)

// Text-to-Speech
const speakText = (text: string) => {
  if (!isTTSEnabled.value || !speechSynthesis) return
  speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'de-DE'
  utterance.rate = 0.8
  utterance.pitch = 1.0
  utterance.volume = 0.8
  speechSynthesis.speak(utterance)
}

// Auto Mode
const startAutoMode = () => {
  if (autoModeInterval.value) return
  currentTileIndex.value = 0
  const cycleTiles = () => {
    if (!isAutoMode.value || isAutoModePaused.value) return
    currentTileIndex.value = (currentTileIndex.value + 1) % umgebungItems.length
    speakText(umgebungItems[currentTileIndex.value].title)
    autoModeInterval.value = window.setTimeout(cycleTiles, 3000)
  }
  speakText(umgebungItems[currentTileIndex.value].title)
  autoModeInterval.value = window.setTimeout(cycleTiles, 3000)
}

const pauseAutoMode = () => {
  isAutoModePaused.value = true
  if (autoModeInterval.value) {
    clearTimeout(autoModeInterval.value)
    autoModeInterval.value = null
  }
  speechSynthesis.cancel()
}

const resumeAutoMode = () => {
  isAutoModePaused.value = false
  if (!autoModeInterval.value) startAutoMode()
}

const stopAutoMode = () => {
  if (autoModeInterval.value) {
    clearTimeout(autoModeInterval.value)
    autoModeInterval.value = null
  }
  speechSynthesis.cancel()
}

// Navigation
function selectUmgebung(id: string) {
  pauseAutoMode()
  speakText(umgebungItems.find(i => i.id === id)?.title || '')
  switch (id) {
    case 'bett': router.push('/bett'); break
    case 'zimmer': router.push('/zimmer'); break
    case 'gegenstaende': router.push('/gegenstaende'); break
    case 'zurueck': router.push('/app'); break
  }
}

// Blink Detection
const handleBlink = () => {
  const now = Date.now()
  if (faceRecognition.isBlinking()) {
    closedFrames.value++
    if (now - lastBlinkTime.value < blinkCooldown.value) return
    if (closedFrames.value >= blinkThreshold.value && !eyesClosed.value) {
      const currentItem = umgebungItems[currentTileIndex.value]
      speakText(currentItem.title)
      selectUmgebung(currentItem.id)
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

// Rechte Maustaste als Blinzel-Ersatz
const handleRightClick = (event: MouseEvent) => {
  event.preventDefault()
  const currentItem = umgebungItems[currentTileIndex.value]
  speakText(currentItem.title)
  selectUmgebung(currentItem.id)
}

// Lifecycle
onMounted(() => {
  if (!faceRecognition.isActive.value) faceRecognition.start()
  isAutoModePaused.value ? resumeAutoMode() : startAutoMode()
  const blinkCheckInterval = setInterval(handleBlink, 100)
  document.addEventListener('contextmenu', handleRightClick)
})

onUnmounted(() => {
  document.removeEventListener('contextmenu', handleRightClick)
  stopAutoMode()
})
</script>

<template>
  <div class="min-h-screen bg-white flex flex-col">
    <GlobalHeader>
      <div class="flex items-center space-x-4">
        <button @click="$router.push('/app')" class="p-2 rounded-lg bg-gray-300 hover:bg-gray-400 transition-colors">
          <svg class="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 class="text-2xl font-bold text-gray-900 font-source-code font-light">UMGEBUNG</h1>
      </div>

      <!-- TTS Toggle -->
      <button
        @click="isTTSEnabled = !isTTSEnabled"
        class="p-2 rounded-lg transition-colors"
        :class="isTTSEnabled ? 'bg-green-300 hover:bg-green-400' : 'bg-gray-300 hover:bg-gray-400'"
        :title="isTTSEnabled ? 'Sprachausgabe deaktivieren' : 'Sprachausgabe aktivieren'"
      >
        <svg v-if="isTTSEnabled" class="w-6 h-6 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/>
        </svg>
        <svg v-else class="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"/>
        </svg>
      </button>
    </GlobalHeader>

    <!-- Main Content -->
    <main class="flex-1 flex items-center justify-center">
      <div class="max-w-7xl mx-auto p-8">
        <div class="grid grid-cols-2 gap-8 w-full max-w-5xl">
          <div
            v-for="item in umgebungItems"
            :key="item.id"
            @click="selectUmgebung(item.id)"
            class="flex flex-col justify-center items-center cursor-pointer rounded-lg p-8 border-2 transition-colors duration-200 shadow-sm"
            :class="[
              activeItemId === item.id
                ? 'bg-teal-700 border-black text-white'
                : 'bg-white border-black text-black hover:bg-gray-100'
            ]"
          >
            <div class="flex items-center justify-center w-24 h-24 mb-6">
              <img
                :src="`/ratatosk.2.0/${item.icon}`"
                :alt="item.title"
                class="w-24 h-24 object-contain transition"
                :class="activeItemId === item.id ? 'brightness-0 invert' : 'brightness-100'"
              />
            </div>
            <div class="text-center font-source-code font-normal text-2xl">
              {{ item.title }}
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>