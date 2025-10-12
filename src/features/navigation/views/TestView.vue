<template>
  <div class="test-view">
    <h1>Test View - No Dependencies</h1>
    <p>If you can see this, the basic Vue app is working.</p>
    <button @click="testClick">Test Button</button>
    <p>Button clicked: {{ clickCount }} times</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const clickCount = ref(0)

const testClick = () => {
  clickCount.value++
  console.log('Button clicked:', clickCount.value)
}
</script>

<style scoped>
.test-view {
  padding: 2rem;
  text-align: center;
}

h1 {
  color: #00796B;
  margin-bottom: 1rem;
}

button {
  padding: 1rem 2rem;
  font-size: 1.2rem;
  background: #00796B;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  margin: 1rem;
}

button:hover {
  background: #005a4a;
}
</style>



