<template>
    <header class="global-header">
      <div class="header-content">
        <!-- Ratatosk Logo and Title (left side) -->
        <div class="header-left">
          <h1 class="header-title">
            RATATOSK
          </h1>
          <img src="/rattenkopf.svg" alt="Ratatosk Logo" class="header-logo" />
          <div class="header-accent"></div>
        </div>
        
        <!-- Right side content (back button, etc.) -->
        <div class="header-right">
          <slot />
        </div>
      </div>
  </header>
</template>

<script setup lang="ts">
// Global header component with consistent dark mode styling
</script>

<style scoped>
/* GlobalHeader verwendet jetzt globale CSS-Klassen aus main.css */
</style>
