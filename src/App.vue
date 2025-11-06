<script setup lang="ts">
// App.vue serves as the main router container
// All logic is now in composables for better organization

import { useAppTheme } from './shared/composables/useAppTheme'
import { useAppLifecycle } from './shared/composables/useAppLifecycle'
import { useGlobalBlinkGestures } from './shared/composables/useGlobalBlinkGestures'

// Theme management
const { appClasses } = useAppTheme()

// App lifecycle (mobile pause/resume, visibility changes)
useAppLifecycle()

// Global blink gestures (5-second blink, SOS detection)
useGlobalBlinkGestures()
</script>

<template>
  <div id="app" :class="appClasses">
    <router-view />
    <!-- TTSActivator removed -->
  </div>
</template>

<style>
/* Nur Tailwind - keine base.css die das Layout stört */
</style>
