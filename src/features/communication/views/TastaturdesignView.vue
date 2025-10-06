<template>
  <div class="min-h-screen bg-white dark:bg-gray-900 flex flex-col">
    <!-- Header -->
    <header class="bg-gray-200 dark:bg-gray-800 shadow-2xl flex-shrink-0" style="box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-4">
          <div class="flex items-center space-x-4">
            <button @click="$router.push('/einstellungen')" class="p-2 rounded-lg bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors">
              <svg class="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 class="text-2xl font-bold text-black dark:text-white font-source-code font-light">
              TASTATURDESIGN
            </h1>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1 flex flex-col items-center justify-center p-8">
      <div class="max-w-6xl mx-auto w-full px-8">
        <!-- Hauptüberschrift außerhalb der Kacheln -->
        <h2 class="font-bold text-gray-900 dark:text-white text-center" style="font-family: 'Source Code Pro', monospace; font-weight: 300; font-size: 3rem;">
          Tastendesign Einstellungen
        </h2>
        
        <!-- Expliziter Abstandshalter -->
        <div class="h-24"></div>
        
        <!-- Grid Container -->
        <div class="grid grid-cols-2 gap-8">
          <!-- Einstellungen -->
          <div class="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 border-2 border-gray-300 dark:border-gray-600">
            <KeyboardDesign 
              @save="keyboardDesignStore.updateSettings"
              @update="updateLocalSettings"
            />
          </div>

          <!-- Live Vorschau -->
          <div class="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 border-2 border-gray-300 dark:border-gray-600">
            <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-4 font-mono text-center">
              Aktuelles Design
            </h3>
            <div class="bg-white dark:bg-gray-700 rounded-lg p-6 border-2 border-gray-300 dark:border-gray-600">
              <div class="flex justify-center gap-4">
                <!-- Beispiel-Tasten -->
                <div 
                  class="flex items-center justify-center border-2 font-bold font-mono"
                  :style="getKeyStyle(keyboardDesignStore, 'active')"
                >
                  A
                </div>
                <div 
                  class="flex items-center justify-center border-2 font-bold font-mono"
                  :style="getKeyStyle(keyboardDesignStore, 'space')"
                >
                  LEER
                </div>
                <div 
                  class="flex items-center justify-center border-2 font-bold font-mono"
                  :style="getKeyStyle(keyboardDesignStore, 'delete')"
                >
                  LÖSCH
                </div>
              </div>
            </div>

            <!-- Einstellungs-Vorschau (unter der Live Vorschau) -->
            <div class="mt-6">
              <h4 class="text-lg font-bold text-gray-900 dark:text-white mb-4 font-mono text-center">
                Neue Einstellungen
              </h4>
              <div class="bg-white dark:bg-gray-700 rounded-lg p-6 border-2 border-gray-300 dark:border-gray-600">
                <div class="flex justify-center gap-4">
                  <!-- Beispiel-Tasten mit aktuellen Einstellungen -->
                  <div 
                    class="flex items-center justify-center border-2 font-bold font-mono"
                    :style="getKeyStyle(localSettings, 'active')"
                  >
                    A
                  </div>
                  <div 
                    class="flex items-center justify-center border-2 font-bold font-mono"
                    :style="getKeyStyle(localSettings, 'space')"
                  >
                    LEER
                  </div>
                  <div 
                    class="flex items-center justify-center border-2 font-bold font-mono"
                    :style="getKeyStyle(localSettings, 'delete')"
                  >
                    LÖSCH
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useKeyboardDesignStore } from '../stores/keyboardDesign'
import KeyboardDesign from '../components/KeyboardDesign.vue'

const keyboardDesignStore = useKeyboardDesignStore()

// Lokale Werte für die Einstellungs-Vorschau
const localSettings = ref({
  keyWidth: 150,
  keyHeight: 60,
  fontSize: 24,
  borderRadius: 8,
  activeKeyBackground: '#3B82F6',
  activeKeyBorder: '#1E40AF',
  activeKeyText: '#FFFFFF',
  spaceKeyBackground: '#6B7280',
  spaceKeyBorder: '#374151',
  deleteKeyBackground: '#EF4444',
  deleteKeyBorder: '#DC2626'
})

const updateLocalSettings = (settings: any) => {
  localSettings.value = { ...localSettings.value, ...settings }
}

// Style-Funktion für Tastatur-Buttons
const getKeyStyle = (settings: any, keyType: 'active' | 'space' | 'delete') => {
  const base = {
    width: settings.keyWidth + 'px',
    height: settings.keyHeight + 'px',
    borderRadius: settings.borderRadius + 'px',
    fontSize: settings.fontSize + 'px',
  }

  const colorStyles = {
    active: {
      backgroundColor: settings.activeKeyBackground,
      borderColor: settings.activeKeyBorder,
      color: settings.activeKeyText,
    },
    space: {
      backgroundColor: settings.spaceKeyBackground,
      borderColor: settings.spaceKeyBorder,
      color: 'white',
    },
    delete: {
      backgroundColor: settings.deleteKeyBackground,
      borderColor: settings.deleteKeyBorder,
      color: 'white',
    }
  }

  return { ...base, ...colorStyles[keyType] }
}
</script>

<style scoped>
.font-source-code {
  font-family: 'Source Code Pro', monospace;
}
</style>
