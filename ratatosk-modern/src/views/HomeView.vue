<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { useCommunicationStore } from '@/stores/communication'
import { useFaceRecognition } from '@/composables/useFaceRecognition'

// Stores
const settingsStore = useSettingsStore()
const communicationStore = useCommunicationStore()

// Face Recognition
const faceRecognition = useFaceRecognition()

// State
const currentMenu = ref('')

// Grid Configuration - Hier können Sie alle Maße zentral ändern
const gridConfig = {
  tileWidth: '422px',
  tilePadding: '67px',
  tilePaddingVertical: '35px',
  tileGap: '32px',
  iconWidth: '119.09px',
  iconHeight: '125px',
  iconSize: '125px', // w-12 h-12
  textSize: '40px',
  borderRadius: '10px',
  outlineWidth: '1.50px',
  backgroundColor: 'rgba(217,217,217,0.10)',
  iconBackgroundColor: '',
  textColor: 'black'
}

// Menu Items mit echten SVG-Icons
const menuItems = [
  {
    id: 'warning',
    title: 'WARNGERÄUSCH',
    description: 'Warnung senden',
    icon: 'bell.svg'
  },
  {
    id: 'communication',
    title: 'UNTERHALTEN',
    description: 'Nachrichten senden und empfangen',
    icon: 'comment-dots.svg'
  },
  {
    id: 'profile',
    title: 'ICH',
    description: 'Persönliche Einstellungen',
    icon: 'user.svg'
  },
  {
    id: 'pain',
    title: 'SCHMERZEN',
    description: 'Schmerzen dokumentieren',
    icon: 'headache.svg'
  },
  {
    id: 'environment',
    title: 'UMGEBUNG',
    description: 'Umgebung beschreiben',
    icon: 'house-chimney.svg'
  },
  {
    id: 'settings',
    title: 'EINSTELLUNGEN',
    description: 'App konfigurieren',
    icon: 'settings-sliders.svg'
  }
]

// Computed
const appClasses = computed(() => [
  'min-h-screen flex flex-col',
  settingsStore.isDarkMode ? 'dark' : '',
  settingsStore.isHighContrast ? 'high-contrast' : '',
  settingsStore.isLargeText ? 'large-text' : ''
])

// Methods
function selectMenu(menuId: string) {
  currentMenu.value = menuId
}

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('de-DE', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

// Lifecycle
onMounted(() => {
  // Ensure face recognition is active if it was started from the start page
  if (!faceRecognition.isActive.value) {
    console.log('Face Recognition nicht aktiv - starte automatisch')
    faceRecognition.start()
  }
})
</script>

<template>
  <div id="app" :class="appClasses">
    <!-- Responsive Layout - automatischer Wechsel zwischen Mobile und Desktop -->
    <div class="min-h-screen bg-white flex flex-col">
      <!-- Header -->
      <header class="bg-[#D9D9D9] shadow-md flex-shrink-0">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between items-center py-4">
            <div class="flex items-center space-x-4">
              <h1 class="text-2xl font-bold text-black font-source-code font-light">
                RATATOSK
              </h1>
              <div class="w-12 h-12 bg-[#00796B] rounded-lg"></div>
              <div class="w-2.5 h-1.5 bg-[#00796B]"></div>
            </div>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="flex-1 flex items-center justify-center">
        <!-- Desktop Layout (3×2 Grid) - wird auf allen Bildschirmen angezeigt -->
        <div class="max-w-7xl mx-auto p-8">
          <div 
            class="grid grid-cols-3" 
            :style="{
              gap: gridConfig.tileGap,
              gridTemplateColumns: `repeat(3, ${gridConfig.tileWidth})`
            }"
          >
            <!-- WARNGERÄUSCH -->
            <div 
              class="flex flex-col justify-start items-center cursor-pointer hover:bg-gray-100 transition-colors"
              :style="{
                width: gridConfig.tileWidth,
                padding: `${gridConfig.tilePaddingVertical} ${gridConfig.tilePadding}`,
                backgroundColor: gridConfig.backgroundColor,
                borderRadius: gridConfig.borderRadius,
                outline: `${gridConfig.outlineWidth} black solid`,
                outlineOffset: `-${gridConfig.outlineWidth}`,
                gap: '26px'
              }"
              @click="selectMenu('warning')"
            >
              <div 
                class="flex items-center justify-center rounded-lg"
                :style="{
                  width: gridConfig.iconWidth,
                  height: gridConfig.iconHeight,
                  backgroundColor: gridConfig.iconBackgroundColor
                }"
              >
                <img 
                  src="/bell.svg" 
                  alt="WARNGERÄUSCH" 
                  :style="{ width: gridConfig.iconSize, height: gridConfig.iconSize }"
                  class="filter brightness-0 invert" 
                />
              </div>
              <div 
                class="text-center font-source-code font-normal"
                :style="{
                  color: gridConfig.textColor,
                  fontSize: gridConfig.textSize
                }"
              >
                WARNGERÄUSCH
              </div>
            </div>

            <!-- UNTERHALTEN -->
            <div 
              class="flex flex-col justify-start items-center cursor-pointer hover:bg-gray-100 transition-colors"
              :style="{
                width: gridConfig.tileWidth,
                padding: `${gridConfig.tilePaddingVertical} ${gridConfig.tilePadding}`,
                backgroundColor: gridConfig.backgroundColor,
                borderRadius: gridConfig.borderRadius,
                outline: `${gridConfig.outlineWidth} black solid`,
                outlineOffset: `-${gridConfig.outlineWidth}`,
                gap: '26px'
              }"
              @click="selectMenu('communication')"
            >
              <div 
                class="flex items-center justify-center rounded-lg"
                :style="{
                  width: gridConfig.iconWidth,
                  height: gridConfig.iconHeight,
                  backgroundColor: gridConfig.iconBackgroundColor
                }"
              >
                <img 
                  src="/comment-dots.svg" 
                  alt="UNTERHALTEN" 
                  :style="{ width: gridConfig.iconSize, height: gridConfig.iconSize }"
                  class="filter brightness-0 invert" 
                />
              </div>
              <div 
                class="text-center font-source-code font-normal"
                :style="{
                  color: gridConfig.textColor,
                  fontSize: gridConfig.textSize
                }"
              >
                UNTERHALTEN
              </div>
            </div>

            <!-- ICH -->
            <div 
              class="flex flex-col justify-start items-center cursor-pointer hover:bg-gray-100 transition-colors"
              :style="{
                width: gridConfig.tileWidth,
                padding: `${gridConfig.tilePaddingVertical} ${gridConfig.tilePadding}`,
                backgroundColor: gridConfig.backgroundColor,
                borderRadius: gridConfig.borderRadius,
                outline: `${gridConfig.outlineWidth} black solid`,
                outlineOffset: `-${gridConfig.outlineWidth}`,
                gap: '26px'
              }"
              @click="selectMenu('profile')"
            >
              <div 
                class="flex items-center justify-center rounded-lg"
                :style="{
                  width: gridConfig.iconWidth,
                  height: gridConfig.iconHeight,
                  backgroundColor: gridConfig.iconBackgroundColor
                }"
              >
                <img 
                  src="/user.svg" 
                  alt="ICH" 
                  :style="{ width: gridConfig.iconSize, height: gridConfig.iconSize }"
                  class="filter brightness-0 invert" 
                />
              </div>
              <div 
                class="text-center font-source-code font-normal"
                :style="{
                  color: gridConfig.textColor,
                  fontSize: gridConfig.textSize
                }"
              >
                ICH
              </div>
            </div>

            <!-- SCHMERZEN -->
            <div 
              class="flex flex-col justify-start items-center cursor-pointer hover:bg-gray-100 transition-colors"
              :style="{
                width: gridConfig.tileWidth,
                padding: `${gridConfig.tilePaddingVertical} ${gridConfig.tilePadding}`,
                backgroundColor: gridConfig.backgroundColor,
                borderRadius: gridConfig.borderRadius,
                outline: `${gridConfig.outlineWidth} black solid`,
                outlineOffset: `-${gridConfig.outlineWidth}`,
                gap: '26px'
              }"
              @click="selectMenu('pain')"
            >
              <div 
                class="flex items-center justify-center rounded-lg"
                :style="{
                  width: gridConfig.iconWidth,
                  height: gridConfig.iconHeight,
                  backgroundColor: gridConfig.iconBackgroundColor
                }"
              >
                <img 
                  src="/headache.svg" 
                  alt="SCHMERZEN" 
                  :style="{ width: gridConfig.iconSize, height: gridConfig.iconSize }"
                  class="filter brightness-0 invert" 
                />
              </div>
              <div 
                class="text-center font-source-code font-normal"
                :style="{
                  color: gridConfig.textColor,
                  fontSize: gridConfig.textSize
                }"
              >
                SCHMERZEN
              </div>
            </div>

            <!-- UMGEBUNG -->
            <div 
              class="flex flex-col justify-start items-center cursor-pointer hover:bg-gray-100 transition-colors"
              :style="{
                width: gridConfig.tileWidth,
                padding: `${gridConfig.tilePaddingVertical} ${gridConfig.tilePadding}`,
                backgroundColor: gridConfig.backgroundColor,
                borderRadius: gridConfig.borderRadius,
                outline: `${gridConfig.outlineWidth} black solid`,
                outlineOffset: `-${gridConfig.outlineWidth}`,
                gap: '26px'
              }"
              @click="selectMenu('environment')"
            >
              <div 
                class="flex items-center justify-center rounded-lg"
                :style="{
                  width: gridConfig.iconWidth,
                  height: gridConfig.iconHeight,
                  backgroundColor: gridConfig.iconBackgroundColor
                }"
              >
                <img 
                  src="/house-chimney.svg" 
                  alt="UMGEBUNG" 
                  :style="{ width: gridConfig.iconSize, height: gridConfig.iconSize }"
                  class="filter brightness-0 invert" 
                />
              </div>
              <div 
                class="text-center font-source-code font-normal"
                :style="{
                  color: gridConfig.textColor,
                  fontSize: gridConfig.textSize
                }"
              >
                UMGEBUNG
              </div>
            </div>

            <!-- EINSTELLUNGEN -->
            <div 
              class="flex flex-col justify-start items-center cursor-pointer hover:bg-gray-100 transition-colors"
              :style="{
                width: gridConfig.tileWidth,
                padding: `${gridConfig.tilePaddingVertical} ${gridConfig.tilePadding}`,
                backgroundColor: gridConfig.backgroundColor,
                borderRadius: gridConfig.borderRadius,
                outline: `${gridConfig.outlineWidth} black solid`,
                outlineOffset: `-${gridConfig.outlineWidth}`,
                gap: '26px'
              }"
              @click="selectMenu('settings')"
            >
              <div 
                class="flex items-center justify-center rounded-lg"
                :style="{
                  width: gridConfig.iconWidth,
                  height: gridConfig.iconHeight,
                  backgroundColor: gridConfig.iconBackgroundColor
                }"
              >
                <img 
                  src="/settings-sliders.svg" 
                  alt="EINSTELLUNGEN" 
                  :style="{ width: gridConfig.iconSize, height: gridConfig.iconSize }"
                  class="filter brightness-0 invert" 
                />
              </div>
              <div 
                class="text-center font-source-code font-normal"
                :style="{
                  color: gridConfig.textColor,
                  fontSize: gridConfig.textSize
                }"
              >
                EINSTELLUNGEN
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>

    <!-- Content Area (Modal) -->
    <div v-if="currentMenu !== ''" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
            {{ menuItems.find(item => item.id === currentMenu)?.title }}
          </h2>
          <button 
            @click="currentMenu = ''"
            class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        <!-- Communication Interface -->
        <div v-if="currentMenu === 'communication'" class="space-y-6">
          <div class="space-y-4">
            <textarea
              v-model="communicationStore.currentMessage"
              placeholder="Nachricht eingeben..."
              class="input-field resize-none h-24"
              @keydown.enter.prevent="communicationStore.sendCurrentMessage"
            ></textarea>
            
            <div class="flex space-x-2">
              <button
                @click="communicationStore.sendCurrentMessage"
                class="btn-primary"
              >
                Senden
              </button>
              <button
                @click="communicationStore.currentMessage = ''"
                class="btn-secondary"
              >
                Löschen
              </button>
            </div>
          </div>

          <!-- Quick Messages -->
          <div class="space-y-4">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              Schnellnachrichten
            </h3>
            <div class="grid grid-cols-2 gap-2">
              <button
                v-for="message in communicationStore.quickMessages"
                :key="message.id"
                @click="communicationStore.addQuickMessage(message.id)"
                class="p-3 text-left rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div class="flex items-center space-x-2">
                  <span class="text-lg">{{ message.icon }}</span>
                  <span class="text-sm">{{ message.text }}</span>
                </div>
              </button>
            </div>
          </div>

          <!-- Message History -->
          <div class="space-y-4">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              Nachrichtenverlauf
            </h3>
            <div class="space-y-2 max-h-64 overflow-y-auto">
              <div
                v-for="message in communicationStore.messages"
                :key="message.id"
                class="p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
              >
                <div class="flex justify-between items-start">
                  <p class="text-sm">{{ message.text }}</p>
                  <span class="text-xs text-gray-500">
                    {{ formatTime(message.timestamp) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Other Menu Content -->
        <div v-else class="text-center py-12">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {{ menuItems.find(item => item.id === currentMenu)?.title }}
          </h2>
          <p class="text-gray-600 dark:text-gray-300">
            {{ menuItems.find(item => item.id === currentMenu)?.description }}
          </p>
          <p class="text-sm text-gray-500 mt-4">
            Diese Funktion wird noch implementiert...
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.high-contrast {
  filter: contrast(150%);
}

.large-text {
  font-size: 1.2em;
}

/* Custom scrollbar */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f5f9;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.dark .overflow-y-auto::-webkit-scrollbar-track {
  background: #374151;
}

.dark .overflow-y-auto::-webkit-scrollbar-thumb {
  background: #6b7280;
}

.dark .overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}
</style>
