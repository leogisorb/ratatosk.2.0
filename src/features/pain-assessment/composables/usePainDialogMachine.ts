/**
 * ✅ MODUL 4 — usePainDialogMachine() (Zentrale State-Machine)
 * 
 * Die gesamte Logik wird zu einem klaren Automaten:
 * 
 * mainView
 *   ↓ selectMainRegion
 * subRegionView
 *   ↓ selectSubRegion
 * painScaleView
 *   ↓ selectPainLevel
 * confirmation
 *   ↓ 5s Timeout
 * mainView
 */

import { ref, computed } from 'vue'
import { useTTS } from './useTTS'
import { useAutoMode } from './useAutoMode'
import { usePainDictionary } from './usePainDictionary'
import { useFaceRecognition } from '../../face-recognition/composables/useFaceRecognition'

export type PainDialogState = 'mainView' | 'subRegionView' | 'painScaleView' | 'confirmation'

export function usePainDialogMachine() {
  const tts = useTTS()
  const dict = usePainDictionary()
  const faceRecognition = useFaceRecognition()

  // ✅ State
  const state = ref<PainDialogState>('mainView')
  const mainRegionId = ref<string | null>(null)
  const subRegionId = ref<string | null>(null)
  const painLevel = ref<number | null>(null)

  // ✅ Computed: Aktuelle Items basierend auf State
  const items = computed(() => {
    if (state.value === 'mainView') return dict.mainRegions
    if (state.value === 'subRegionView') return dict.getSubRegions(mainRegionId.value)
    if (state.value === 'painScaleView') return dict.painLevels
    return []
  })

  // ✅ Computed: Aktueller Titel basierend auf State
  const title = computed(() => {
    switch (state.value) {
      case 'mainView':
        return 'Wo haben Sie Schmerzen?'
      case 'subRegionView':
        return dict.getSubRegionViewTitle(mainRegionId.value)
      case 'painScaleView':
        return 'Wie stark sind Ihre Schmerzen?'
      case 'confirmation':
        return 'Bestätigung'
      default:
        return ''
    }
  })

  // ✅ Computed: Bestätigungstext
  const confirmationText = computed(() => {
    return dict.generateConfirmation(subRegionId.value, painLevel.value)
  })

  // ✅ AutoMode konfigurieren
  const autoMode = useAutoMode({
    speak: tts.speak,
    getItems: () => items.value,
    getTitle: () => title.value,
  })

  // ✅ Hauptregion auswählen
  async function selectMainRegion(id: string) {
    // ✅ Blockiere "zurueck" in mainView
    if (id === 'zurueck') return
    
    // Stoppe AutoMode
    autoMode.stop()
    
    // Setze State
    mainRegionId.value = id
    state.value = 'subRegionView'
    
    // ✅ Spreche neuen Titel (skipTitle = true, da Titel hier schon gesprochen wird)
    await tts.speak(title.value)
    
    // Starte AutoMode nach 3 Sekunden (skipTitle = true, Titel wurde bereits gesprochen)
    setTimeout(() => {
      if (state.value === 'subRegionView') {
        autoMode.start(true) // ✅ skipTitle = true, da Titel bereits gesprochen
      }
    }, 3000)
  }

  // ✅ Unterregion auswählen
  async function selectSubRegion(id: string) {
    // Stoppe AutoMode
    autoMode.stop()
    
    // ✅ Robustes zurueck-Handling
    if (id === 'zurueck') {
      mainRegionId.value = null
      state.value = 'mainView'
      
      await tts.speak(title.value)
      
      // Starte AutoMode nach 3 Sekunden (skipTitle = true, Titel wurde bereits gesprochen)
      setTimeout(() => {
        if (state.value === 'mainView') {
          autoMode.start(true) // ✅ skipTitle = true
        }
      }, 3000)
      return
    }
    
    // Setze State
    subRegionId.value = id
    state.value = 'painScaleView'
    
    // ✅ Spreche neuen Titel (skipTitle = true, da Titel hier schon gesprochen wird)
    await tts.speak(title.value)
    
    // Starte AutoMode nach 3 Sekunden (skipTitle = true, Titel wurde bereits gesprochen)
    setTimeout(() => {
      if (state.value === 'painScaleView') {
        autoMode.start(true) // ✅ skipTitle = true, da Titel bereits gesprochen
      }
    }, 3000)
  }

  // ✅ Schmerzlevel auswählen
  async function selectPainLevel(level: number) {
    // Stoppe AutoMode
    autoMode.stop()
    
    // Setze State
    painLevel.value = level
    state.value = 'confirmation'
    
    // Spreche Bestätigungstext
    const textToSpeak = confirmationText.value || 'Ihre Angabe wurde gespeichert.'
    await tts.speak(textToSpeak)
    
    // Nach 5 Sekunden zurück zum Start
    setTimeout(() => {
      // Reset State
      state.value = 'mainView'
      mainRegionId.value = null
      subRegionId.value = null
      painLevel.value = null
      
      // Spreche Titel
      tts.speak(title.value)
      
      // Starte AutoMode nach 3 Sekunden (skipTitle = true, Titel wurde bereits gesprochen)
      setTimeout(() => {
        if (state.value === 'mainView') {
          autoMode.start(true) // ✅ skipTitle = true, da Titel bereits gesprochen
        }
      }, 3000)
    }, 5000)
  }

  // ✅ Blink-Handler
  function handleBlink() {
    const currentItems = items.value
    if (!currentItems || !currentItems.length) return
    
    const currentIndex = autoMode.index.value
    const currentItem = currentItems[currentIndex]
    
    if (!currentItem) return
    
    // ✅ Robustes zurueck-Handling
    if (currentItem.id === 'zurueck') {
      // Zurück ist nur erlaubt in subRegionView
      if (state.value === 'subRegionView') {
        selectSubRegion('zurueck')
      }
      return
    }
    
    // State-spezifische Auswahl
    if (state.value === 'mainView') {
      if (typeof currentItem.id === 'string') {
        selectMainRegion(currentItem.id)
      }
    } else if (state.value === 'subRegionView') {
      if (typeof currentItem.id === 'string') {
        selectSubRegion(currentItem.id)
      }
    } else if (state.value === 'painScaleView') {
      // Pain levels haben level property
      if ('level' in currentItem && typeof currentItem.level === 'number') {
        selectPainLevel(currentItem.level)
      } else if ('id' in currentItem && typeof currentItem.id === 'number') {
        // Fallback: falls id als number verwendet wird
        selectPainLevel(currentItem.id)
      }
    }
  }

  return {
    // State
    state: computed(() => state.value),
    mainRegionId: computed(() => mainRegionId.value),
    subRegionId: computed(() => subRegionId.value),
    painLevel: computed(() => painLevel.value),
    
    // Computed
    items,
    title,
    confirmationText,
    
    // AutoMode
    autoMode,
    
    // Actions
    selectMainRegion,
    selectSubRegion,
    selectPainLevel,
    handleBlink,
    
    // TTS
    speak: tts.speak,
    isSpeaking: tts.isSpeaking,
    
    // Dictionary Helpers
    findMainRegion: dict.findMainRegion,
    findSubRegion: dict.findSubRegion,
    findPainLevel: dict.findPainLevel,
  }
}

