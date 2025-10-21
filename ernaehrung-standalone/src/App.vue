<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup lang="ts">
// App component for standalone nutrition feature
</script>

<style>
#app {
  min-height: 100vh;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  transition: background-color 0.3s ease, color 0.3s ease;
}
</style>

