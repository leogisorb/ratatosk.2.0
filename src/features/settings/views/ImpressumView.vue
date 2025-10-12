<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSettingsStore } from '../stores/settings'
import AppHeader from '../../../shared/components/AppHeader.vue'

// Router
const router = useRouter()

// Stores
const settingsStore = useSettingsStore()

// Text-to-Speech
const speechSynthesis = window.speechSynthesis
const isTTSEnabled = ref(true)

// Computed
const appClasses = computed(() => ({
  'dark': settingsStore.isDarkMode
}))

// Text-to-Speech Funktion
const speakText = (text: string) => {
  console.log('ImpressumView speakText called with:', text, 'isTTSEnabled:', isTTSEnabled.value, 'speechSynthesis:', speechSynthesis)
  
  if (!isTTSEnabled.value || !speechSynthesis) {
    console.log('ImpressumView TTS disabled or speechSynthesis not available')
    return
  }
  
  speechSynthesis.cancel()
  
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'de-DE'
  utterance.rate = 0.8
  utterance.pitch = 1.0
  utterance.volume = 0.8
  
  console.log('ImpressumView Speaking:', text)
  speechSynthesis.speak(utterance)
}

// TTS Toggle
const toggleTTS = () => {
  console.log('ImpressumView toggleTTS called, current state:', isTTSEnabled.value)
  isTTSEnabled.value = !isTTSEnabled.value
  console.log('ImpressumView TTS toggled to:', isTTSEnabled.value)
  
  if (!isTTSEnabled.value) {
    speechSynthesis.cancel()
    console.log('ImpressumView TTS cancelled')
  } else {
    // Test TTS when enabling
    speakText('Sprachausgabe aktiviert')
  }
}

// Lifecycle
onMounted(() => {
  // Spreche den Titel und ersten Abschnitt vor
  setTimeout(() => {
    speakText('Impressum. Ratatosk - Assistive Technologie für Menschen mit Behinderungen.')
  }, 1000)
})

onUnmounted(() => {
  // Stoppe TTS beim Verlassen
  speechSynthesis.cancel()
})
</script>

<template>
  <div id="app" :class="appClasses">
    <div class="min-h-screen bg-white">
      <!-- App Header -->
      <AppHeader />

      <!-- Main Content -->
      <main class="flex-1 p-8 max-w-4xl mx-auto">
        <div class="bg-white rounded-lg shadow-lg p-8">
          <h2 class="text-4xl font-bold text-gray-800 mb-8 text-center">
            Impressum
          </h2>
          
          <div class="prose prose-lg max-w-none">
            <section class="mb-8">
              <h3 class="text-2xl font-semibold text-gray-700 mb-4">Ratatosk - Assistive Technologie</h3>
              <p class="text-gray-600 leading-relaxed mb-4">
                Ratatosk ist eine innovative Assistive-Technologie-Anwendung, die speziell für Menschen mit Behinderungen entwickelt wurde. 
                Die Anwendung nutzt moderne Web-Technologien und Gesichtserkennung, um eine barrierefreie Benutzeroberfläche zu bieten.
              </p>
            </section>

            <section class="mb-8">
              <h3 class="text-2xl font-semibold text-gray-700 mb-4">Entwicklung</h3>
              <p class="text-gray-600 leading-relaxed mb-4">
                Diese Anwendung wurde im Rahmen einer Bachelorarbeit entwickelt und dient als Prototyp für zukünftige 
                Assistive-Technologie-Lösungen. Die Implementierung erfolgte mit Vue.js 3, TypeScript und modernen Web-APIs.
              </p>
            </section>

            <section class="mb-8">
              <h3 class="text-2xl font-semibold text-gray-700 mb-4">Funktionen</h3>
              <ul class="text-gray-600 leading-relaxed list-disc list-inside space-y-2">
                <li>Gesichtserkennung und Blinzeln-Erkennung für Navigation</li>
                <li>Text-to-Speech (TTS) für Sprachausgabe</li>
                <li>Schmerz-Assessment mit visueller Skala</li>
                <li>Kommunikationshilfen</li>
                <li>Umgebungssteuerung</li>
                <li>Anpassbare Einstellungen</li>
              </ul>
            </section>

            <section class="mb-8">
              <h3 class="text-2xl font-semibold text-gray-700 mb-4">Datenschutz</h3>
              <p class="text-gray-600 leading-relaxed mb-4">
                Alle Datenverarbeitung erfolgt lokal im Browser. Keine persönlichen Daten werden an externe Server übertragen. 
                Die Gesichtserkennung arbeitet vollständig offline und speichert keine Bilddaten.
              </p>
            </section>

            <section class="mb-8">
              <h3 class="text-2xl font-semibold text-gray-700 mb-4">Technische Anforderungen</h3>
              <ul class="text-gray-600 leading-relaxed list-disc list-inside space-y-2">
                <li>Moderner Webbrowser mit WebRTC-Unterstützung</li>
                <li>Kamera für Gesichtserkennung</li>
                <li>Mikrofon für Sprachausgabe (optional)</li>
                <li>JavaScript aktiviert</li>
              </ul>
            </section>

            <section class="mb-8">
              <h3 class="text-2xl font-semibold text-gray-700 mb-4">Haftungsausschluss</h3>
              <p class="text-gray-600 leading-relaxed mb-4">
                Diese Anwendung ist ein Prototyp und dient ausschließlich zu Forschungs- und Demonstrationszwecken. 
                Für die Verwendung in medizinischen oder therapeutischen Kontexten ist eine entsprechende Validierung erforderlich.
              </p>
            </section>

            <section class="text-center">
              <p class="text-gray-500 text-sm">
                © 2024 Ratatosk - Assistive Technologie Prototyp
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.font-source-code {
  font-family: 'Source Code Pro', monospace;
}

.prose {
  color: #374151;
}

.prose h3 {
  color: #1f2937;
  border-bottom: 2px solid #e5e7eb;
  padding-bottom: 0.5rem;
}

.prose ul {
  margin-left: 1rem;
}

.prose li {
  margin-bottom: 0.5rem;
}
</style>
