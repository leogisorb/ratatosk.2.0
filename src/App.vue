<script setup lang="ts">
// App.vue serves as the main router container
import TTSActivator from './shared/components/TTSActivator.vue'
</script>

<template>
  <div id="app">
    <router-view />
    <TTSActivator />
  </div>
</template>

<style>
/* Nur Tailwind - keine base.css die das Layout stört */
</style>
