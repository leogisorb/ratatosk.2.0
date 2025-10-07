<template>
  <header class="bg-gray-200 dark:bg-gray-800 shadow-2xl flex-shrink-0" style="box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center py-4">
        <!-- Ratatosk Logo and Title (left side) -->
        <div class="flex items-center space-x-4">
          <h1 class="text-2xl font-bold text-black dark:text-white" style="font-family: 'Source Code Pro', monospace; font-weight: 300;">
            RATATOSK
          </h1>
          <img src="/rattenkopf.svg" alt="Ratatosk Logo" class="w-12 h-12" />
          <div class="w-2.5 h-1.5 bg-[#00796B]"></div>
        </div>
        
        <!-- Right side content (back button, etc.) -->
        <div class="flex items-center space-x-4">
          <slot />
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
// Global header component with consistent dark mode styling
</script>
