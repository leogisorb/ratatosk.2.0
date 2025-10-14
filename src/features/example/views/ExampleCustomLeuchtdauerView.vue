<template>
  <div class="example-view">
    <h1>Beispiel: Benutzerdefinierte Leuchtdauer</h1>
    
    <!-- Standard-Button mit globaler Leuchtdauer -->
    <button 
      class="standard-button"
      :style="{ transition: standardTransition }"
      @click="handleStandardClick"
    >
      Standard (globale Leuchtdauer)
    </button>
    
    <!-- Schneller Button mit benutzerdefinierter Leuchtdauer -->
    <button 
      class="fast-button"
      :style="{ transition: fastTransition }"
      @click="handleFastClick"
    >
      Schnell (0.5s benutzerdefiniert)
    </button>
    
    <!-- Langsamer Button mit benutzerdefinierter Leuchtdauer -->
    <button 
      class="slow-button"
      :style="{ transition: slowTransition }"
      @click="handleSlowClick"
    >
      Langsam (2s benutzerdefiniert)
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { createTransition, getLeuchtdauer } from '../../../core/utils/leuchtdauerUtils'

// Standard-Transition mit globaler Leuchtdauer
const standardTransition = computed(() => 
  createTransition('ExampleView', ['background-color', 'transform'])
)

// Schnelle Transition mit benutzerdefinierter Leuchtdauer (0.5s)
const fastTransition = computed(() => 
  createTransition('ExampleView', ['background-color', 'transform'], 0.5)
)

// Langsame Transition mit benutzerdefinierter Leuchtdauer (2s)
const slowTransition = computed(() => 
  createTransition('ExampleView', ['background-color', 'transform'], 2)
)

// Event Handlers
const handleStandardClick = () => {
  console.log('Standard Button clicked - verwendet globale Leuchtdauer')
}

const handleFastClick = () => {
  console.log('Fast Button clicked - verwendet 0.5s Leuchtdauer')
}

const handleSlowClick = () => {
  console.log('Slow Button clicked - verwendet 2s Leuchtdauer')
}
</script>

<style scoped>
.example-view {
  padding: 2rem;
  text-align: center;
}

.standard-button,
.fast-button,
.slow-button {
  display: block;
  margin: 1rem auto;
  padding: 1rem 2rem;
  border: none;
  border-radius: 8px;
  background-color: #3b82f6;
  color: white;
  font-size: 1.1rem;
  cursor: pointer;
  width: 300px;
}

.standard-button:hover {
  background-color: #1d4ed8;
  transform: scale(1.05);
}

.fast-button:hover {
  background-color: #1d4ed8;
  transform: scale(1.05);
}

.slow-button:hover {
  background-color: #1d4ed8;
  transform: scale(1.05);
}
</style>
