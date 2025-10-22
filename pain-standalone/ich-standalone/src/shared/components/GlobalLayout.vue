<template>
  <div class="min-h-screen bg-white">
    <!-- Global Header -->
    <GlobalHeader>
      <slot name="header" />
    </GlobalHeader>
    
    <!-- Main Content -->
    <main class="flex-1">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
// Global layout component that handles dark mode for all pages
import GlobalHeader from './GlobalHeader.vue'
</script>
