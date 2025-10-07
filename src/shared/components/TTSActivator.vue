<template>
  <!-- TTS wird automatisch aktiviert, kein Overlay nötig -->
</template>

<script setup lang="ts">
import { onMounted } from 'vue'

onMounted(() => {
  // Aktiviere TTS sofort und einfach
  console.log('TTS Activator: Setting global TTS status...')
  ;(window as any).ttsActivated = true
  
  // Kein TTS-Test mehr - nur Status setzen
  console.log('TTS Activator: TTS status set to true')
})
</script>

<style scoped>
/* Styles sind in main.css definiert */
</style>
