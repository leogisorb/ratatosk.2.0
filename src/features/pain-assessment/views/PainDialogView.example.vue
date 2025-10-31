<!-- 
  ✅ BEISPIEL: Verwendung des InputManagers in PainDialogView
  
  Statt:
  - handleBlink()
  - handleRightClick()
  - addEventListener für faceBlinkDetected
  
  Jetzt einfach:
  - useInputManager() mit onSelect Callback
  - Einheitliche API für alle Input-Typen
  - Einfach erweiterbar für Voice/Gestures
-->

<template>
  <!-- ... existing template ... -->
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { usePainDialogMachine } from '../composables/usePainDialogMachine'
import { useFaceRecognition } from '../../face-recognition/composables/useFaceRecognition'
import { useInputManager } from '../../../shared/composables/useInputManager'
import AppHeader from '../../../shared/components/AppHeader.vue'

// ✅ Neue modulare Architektur
const machine = usePainDialogMachine()
const faceRecognition = useFaceRecognition()

// ✅ Input Manager statt einzelner Handler
const inputManager = useInputManager({
  onSelect: (event) => {
    console.log('Input detected:', event.type, event.source)
    
    // ✅ Einheitlicher Callback für alle Input-Typen
    // Blink, Click, Touch → alle rufen handleBlink() auf
    machine.handleBlink()
  },
  enabledInputs: ['blink', 'click', 'touch'], // ✅ Einfach konfigurierbar
  cooldown: 300 // ✅ Verhindert zu häufige Inputs
})

// ✅ Destructure für Template
const {
  state,
  items,
  title,
  confirmationText,
  autoMode,
  selectMainRegion,
  selectSubRegion,
  selectPainLevel,
  handleBlink,
} = machine

// ... existing helper functions ...

// ✅ Lifecycle - VIEL EINFACHER!
onMounted(() => {
  // Start Face Recognition
  if (!faceRecognition.isActive.value) {
    faceRecognition.start()
  }
  
  // Start AutoMode
  autoMode.start()
  
  // ✅ Start Input Manager - alle Handler werden automatisch registriert!
  inputManager.start()
})

onUnmounted(() => {
  // Stop AutoMode
  autoMode.stop()
  
  // ✅ Stop Input Manager - alle Handler werden automatisch entfernt!
  inputManager.stop()
  
  // Stop Face Recognition
  if (faceRecognition.isActive.value) {
    faceRecognition.stop()
  }
})
</script>

