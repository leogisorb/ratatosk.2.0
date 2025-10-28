<template>
  <div id="app" class="settings-dialog">
    <!-- App Header -->
    <AppHeader />

    <!-- Main Content -->
    <main class="main-content">
      <div class="content-wrapper">
        
        <!-- Main View: Settings Categories -->
        <div v-if="currentState === 'mainView'">
          <div class="main-title">
            Welche Einstellung möchten Sie ändern?
          </div>

          <div class="grid-container">
            <!-- Dynamic Menu Tiles -->
            <div 
              v-for="(category, index) in settingsCategories"
              :key="category.id"
              class="menu-tile"
              :class="[
                currentTileIndex === index ? 'tile-active' : 'tile-inactive',
                category.id === 'zurueck' ? 'back-tile' : ''
              ]"
              @click="category.id === 'zurueck' ? goBack() : selectCategory(category.id)"
              @contextmenu.prevent="category.id === 'zurueck' ? goBack() : handleCategoryRightClick($event, category.id)"
            >
              <div 
                class="tile-icon-container"
                :class="currentTileIndex === index ? 'icon-active' : 'icon-inactive'"
              >
                <img 
                  v-if="category.icon" 
                  :src="category.icon" 
                  :alt="category.title" 
                  class="tile-icon"
                  :class="currentTileIndex === index ? 'icon-inverted' : ''"
                />
              </div>
              <div 
                class="tile-text"
                :class="currentTileIndex === index ? 'text-active' : 'text-inactive'"
              >
                {{ category.title }}
              </div>
            </div>
          </div>
        </div>

        <!-- Settings Options View -->
        <div v-if="currentState === 'optionsView'">
          <div class="main-title">
            {{ getCategoryTitle(selectedCategory) }}
          </div>
          <div class="current-setting">
            Aktuell: {{ getCurrentValue(selectedCategory) }}
          </div>

          <!-- Karussell Wrapper für vertikale Zentrierung -->
          <div class="carousel-wrapper">
            <!-- Karussell Container -->
            <div class="carousel-container">
              <!-- Karussell Content -->
              <div class="carousel-content">
                <div 
                  v-for="(option, index) in currentOptions"
                  :key="option.id"
                  class="carousel-item"
                  :class="currentTileIndex === index ? 'carousel-item-active' : 'carousel-item-inactive'"
                  :style="getCarouselItemStyle(index)"
                  @click="selectOption(option.id)"
                  @contextmenu.prevent="handleOptionRightClick($event, option.id)"
                >
                  <div class="carousel-item-content">
                    <div 
                      class="tile-icon-container"
                      :class="currentTileIndex === index ? 'icon-active' : 'icon-inactive'"
                    >
                      <div v-if="option.emoji" class="tile-emoji">{{ option.emoji }}</div>
                      <img 
                        v-else-if="option.icon" 
                        :src="option.icon" 
                        :alt="option.title" 
                        class="tile-icon"
                        :class="currentTileIndex === index ? 'icon-inverted' : ''"
                      />
                    </div>
                    <div 
                      class="tile-text"
                      :class="currentTileIndex === index ? 'text-active' : 'text-inactive'"
                    >
                      {{ option.title }}
                    </div>
                    <div 
                      v-if="option.description"
                      class="tile-description"
                      :class="currentTileIndex === index ? 'text-active' : 'text-inactive'"
                    >
                      {{ option.description }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Karussell Indicators - außerhalb des optionsView -->
        <div v-if="currentState === 'optionsView'" class="carousel-indicators">
          <button 
            v-for="(option, index) in currentOptions"
            :key="`indicator-${option.id}`"
            class="carousel-indicator"
            :class="currentTileIndex === index ? 'carousel-indicator-active' : 'carousel-indicator-inactive'"
            @click="goToOption(index)"
          >
          </button>
        </div>

        <!-- Confirmation View -->
        <div v-if="currentState === 'confirmation'">
          <div class="confirmation-container">
            <h2>Einstellung gespeichert</h2>
            <p>{{ getCategoryTitle(selectedCategory) }} - {{ getSelectedOptionTitle() }}</p>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useSettingsDialogLogic } from './SettingsDialogView.ts'
import AppHeader from '../../../shared/components/AppHeader.vue'

// Settings dialog states
type SettingsDialogState = 'mainView' | 'optionsView' | 'confirmation'

// Reactive state
const currentState = ref<SettingsDialogState>('mainView')
const selectedCategory = ref<string | null>(null)
const selectedOption = ref<string | null>(null)
const hasUserInteracted = ref(false)

// Use settings dialog composable
const {
  currentTileIndex,
  isAutoMode,
  startAutoMode,
  pauseAutoMode,
  stopAutoMode,
  speakText,
  setupLifecycle,
  settingsCategories,
  getCategoryOptions,
  getCategoryTitle,
  getOptionTitle,
  getCurrentValue,
  saveSetting
} = useSettingsDialogLogic()

// Computed properties
const currentOptions = computed(() => {
  if (!selectedCategory.value) return []
  return getCategoryOptions(selectedCategory.value)
})

// Helper functions
const getSelectedOptionTitle = () => {
  if (!selectedOption.value) return ''
  return getOptionTitle(selectedCategory.value!, selectedOption.value)
}

// Navigation functions
const selectCategory = async (categoryId: string) => {
  console.log('Selecting category:', categoryId)
  
  // Spezielle Behandlung für Zurück-Kachel
  if (categoryId === 'zurueck') {
    goBack()
    return
  }
  
  if (!hasUserInteracted.value) {
    hasUserInteracted.value = true
    console.log('User first interaction - TTS now enabled')
  }
  
  selectedCategory.value = categoryId
  currentState.value = 'optionsView'
  currentTileIndex.value = 0
  
  const category = settingsCategories.find(c => c.id === categoryId)
  if (category) {
    console.log(`Einstellungen für ${category.title}`)
  }
}

const selectOption = async (optionId: string) => {
  console.log('Selecting option:', optionId)
  
  if (optionId === 'zurueck') {
    // Zurück zu den Kategorien
    currentState.value = 'mainView'
    currentTileIndex.value = 0
    selectedCategory.value = null
    selectedOption.value = null
    return
  }
  
  selectedOption.value = optionId
  currentState.value = 'confirmation'
  
  // Speichere die Einstellung
  await saveSetting(selectedCategory.value!, optionId)
  
  const categoryTitle = getCategoryTitle(selectedCategory.value)
  const optionTitle = getOptionTitle(selectedCategory.value!, selectedOption.value)
  console.log(`Einstellung gespeichert: ${categoryTitle} - ${optionTitle}`)
  
  // TTS für Bestätigung
  setTimeout(() => {
    speakText('Einstellung gespeichert')
  }, 500)
  
  setTimeout(() => {
    speakText(`${categoryTitle} - ${optionTitle}`)
  }, 2000)
  
  // After confirmation, return to main view after 6.5 seconds
  setTimeout(() => {
    resetToMainView()
  }, 6500)
}

const resetToMainView = async () => {
  currentState.value = 'mainView'
  currentTileIndex.value = 0
  selectedCategory.value = null
  selectedOption.value = null
  
  console.log('Welche Einstellung möchten Sie ändern?')
  
  // Start auto-mode for categories
  if (!isAutoMode.value) {
    setTimeout(() => {
      startAutoMode(settingsCategories, 1000, 3000)
    }, 2000)
  }
}

// Right-click handlers
const handleCategoryRightClick = (event: MouseEvent, categoryId: string) => {
  event.preventDefault()
  event.stopPropagation()
  event.stopImmediatePropagation()
  console.log('SettingsDialogView: Right click detected on category:', categoryId)
  selectCategory(categoryId)
  return false
}

const handleOptionRightClick = (event: MouseEvent, optionId: string) => {
  event.preventDefault()
  event.stopPropagation()
  event.stopImmediatePropagation()
  console.log('SettingsDialogView: Right click detected on option:', optionId)
  selectOption(optionId)
  return false
}

// Selection handlers for different views
const handleCategorySelection = (item: any) => {
  console.log('Category selection handler called with:', item)
  if (item && item.id) {
    selectCategory(item.id)
  }
}

const handleOptionSelection = (item: any) => {
  console.log('Option selection handler called with:', item)
  selectOption(item.id)
}

const goBack = () => {
  console.log('SettingsDialogView: Going back to main app')
  window.location.href = '/ratatosk.2.0/app'
}

const goToOption = (index: number) => {
  console.log('goToOption called with index:', index, 'current:', currentTileIndex.value)
  if (index >= 0 && index < currentOptions.value.length) {
    currentTileIndex.value = index
    console.log('currentTileIndex updated to:', currentTileIndex.value)
  } else {
    // Reibungsloser Loop
    if (index < 0) {
      currentTileIndex.value = currentOptions.value.length - 1
    } else if (index >= currentOptions.value.length) {
      currentTileIndex.value = 0
    }
    console.log('Looped currentTileIndex to:', currentTileIndex.value)
  }
}

// Karussell Style-Funktion (wie im Pain Dialog)
const getCarouselItemStyle = (index: number) => {
  const offset = index - currentTileIndex.value
  const rotation = index < currentTileIndex.value ? -20 : index > currentTileIndex.value ? 20 : 0
  
  return {
    '--offset': offset,
    '--rotation': `${rotation}deg`
  }
}

// Lifecycle management
let cleanup: (() => void) | null = null

onMounted(() => {
  console.log('SettingsDialogView mounted, current state:', currentState.value)
  
  // Erst die Überschrift vorlesen, dann Auto-Mode starten
  setTimeout(() => {
    speakText('Welche Einstellung möchten Sie ändern?')
  }, 500)
  
  // Auto-Mode nach 4 Sekunden starten (nach TTS)
  setTimeout(() => {
    cleanup = setupLifecycle(settingsCategories, handleCategorySelection)
  }, 4000)
})

onUnmounted(() => {
  if (cleanup) {
    cleanup()
  }
  stopAutoMode()
})

// Watch for state changes to update lifecycle
watch(currentState, (newState) => {
  console.log('State changed to:', newState)
  stopAutoMode()
  
  // Clean up previous lifecycle
  if (cleanup) {
    cleanup()
  }
  
  // Reset tile index for new state
  currentTileIndex.value = 0
  
  // Setup new lifecycle based on state
  switch (newState) {
    case 'mainView':
      console.log('Setting up main view with', settingsCategories.length, 'categories')
      // Erst Überschrift vorlesen, dann Auto-Mode
      setTimeout(() => {
        speakText('Welche Einstellung möchten Sie ändern?')
      }, 500)
      setTimeout(() => {
        cleanup = setupLifecycle(settingsCategories, handleCategorySelection)
      }, 4000)
      break
    case 'optionsView':
      console.log('Setting up options view with', currentOptions.value.length, 'options')
      // Erst Kategorie-Titel vorlesen, dann Auto-Mode
      const categoryTitle = getCategoryTitle(selectedCategory.value)
      setTimeout(() => {
        speakText(`Einstellungen für ${categoryTitle}`)
      }, 500)
      setTimeout(() => {
        cleanup = setupLifecycle(currentOptions.value, handleOptionSelection)
      }, 4000)
      break
  }
})
</script>

<style scoped>
@import './SettingsDialogView.css';
</style>
