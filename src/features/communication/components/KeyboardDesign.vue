<template>
  <div class="keyboard-design-settings">
    
    <div class="grid grid-cols-2 gap-6 mb-12">
      <!-- Tastenbreite -->
      <div>
        <label class="block text-lg font-medium mb-3">Tastenbreite (px)</label>
        <input 
          v-model="keyWidth" 
          type="number" 
          class="w-full p-4 text-lg border-2 rounded-lg"
          min="20" 
          max="200"
        />
      </div>
      
      <!-- Tastenhöhe -->
      <div>
        <label class="block text-lg font-medium mb-3">Tastenhöhe (px)</label>
        <input 
          v-model="keyHeight" 
          type="number" 
          class="w-full p-4 text-lg border-2 rounded-lg"
          min="20" 
          max="200"
        />
      </div>
      
      <!-- Schriftgröße -->
      <div>
        <label class="block text-lg font-medium mb-3">Schriftgröße (px)</label>
        <input 
          v-model="fontSize" 
          type="number" 
          class="w-full p-4 text-lg border-2 rounded-lg"
          min="8" 
          max="48"
        />
      </div>
      
      <!-- Ecken-Rundung -->
      <div>
        <label class="block text-lg font-medium mb-3">Ecken-Rundung (px)</label>
        <input 
          v-model="borderRadius" 
          type="number" 
          class="w-full p-4 text-lg border-2 rounded-lg"
          min="0" 
          max="20"
        />
      </div>
    </div>
    
    <!-- Expliziter Abstandshalter -->
    <div class="h-12"></div>
    
    <!-- Buttons -->
    <div class="flex gap-8 justify-center">
      <button 
        @click="resetToDefaults"
        class="flex items-center justify-center border-2 bg-gray-500 text-black font-bold hover:bg-gray-600 transition-colors w-64 h-20 rounded-lg text-xl font-source-code"
      >
        Zurücksetzen
      </button>
      <button 
        @click="applySettings"
        class="flex items-center justify-center border-2 bg-blue-500 text-black font-bold hover:bg-blue-600 transition-colors w-80 h-20 rounded-lg text-xl font-source-code"
      >
        Einstellungen anwenden
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

// Tastendesign Einstellungen
const keyWidth = ref(150)  // 150px breit
const keyHeight = ref(60) // 60px hoch
const fontSize = ref(24)
const borderRadius = ref(8) // Mit Border-Radius

const emit = defineEmits<{
  save: [settings: {
    keyWidth: number
    keyHeight: number
    fontSize: number
    borderRadius: number
  }]
  update: [settings: {
    keyWidth: number
    keyHeight: number
    fontSize: number
    borderRadius: number
  }]
}>()

const applySettings = () => {
  emit('save', {
    keyWidth: keyWidth.value,
    keyHeight: keyHeight.value,
    fontSize: fontSize.value,
    borderRadius: borderRadius.value
  })
}

const resetToDefaults = () => {
  keyWidth.value = 150
  keyHeight.value = 60
  fontSize.value = 24
  borderRadius.value = 8
}

// Emit update event when values change
watch([keyWidth, keyHeight, fontSize, borderRadius], () => {
  emit('update', {
    keyWidth: keyWidth.value,
    keyHeight: keyHeight.value,
    fontSize: fontSize.value,
    borderRadius: borderRadius.value
  })
}, { immediate: true })
</script>

<style scoped>
.font-source-code {
  font-family: 'Source Code Pro', monospace;
}
</style>
