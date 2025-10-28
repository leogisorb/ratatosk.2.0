<script setup lang="ts">
// Import external JavaScript logic
import { useHomeViewLogic } from './HomeView.ts'
import AppHeader from '../../../shared/components/AppHeader.vue'
import MenuTile from '../components/MenuTile.vue'

// Use the composable function
const {
  currentMenu,
  currentTileIndex,
  isAutoMode,
  userInteracted,
  // Mobile Carousel State
  isMobile,
  carouselOffset,
  carouselStyle,
  currentItem,
  itemCount,
  autoScrollState,
  touchState,
  isSwipe,
  swipeDirection,
  // TTS functions
  speakText,
  menuItems,
  appClasses,
  startAutoMode,
  stopAutoMode,
  // Mobile Carousel functions
  handleTouchStart,
  handleTouchMove,
  handleTouchEnd,
  // Karussell-Navigation
  navigateToIndex,
  navigateNext,
  navigatePrevious,
  // Keyboard Navigation
  handleKeyboardNavigation,
  selectMenu,
  formatTime,
  handleFaceBlink,
  handleRightClick,
  handleVolumeToggle,
  settingsStore,
  communicationStore,
  faceRecognition
} = useHomeViewLogic()
</script>

<template>
  <div id="app" :class="appClasses" class="home-view">
    <!-- App Header -->
    <AppHeader />

    <!-- Hauptinhalt -->
    <main class="main-content">
        
        <!-- TTS Status Indicator removed -->
        
        <!-- Desktop Layout (3×2 Grid) - wird auf Desktop angezeigt -->
        <div class="grid-container desktop-grid" v-if="!isMobile">
            <!-- WARNGERÄUSCH -->
            <div 
              class="menu-tile"
              :class="currentTileIndex === 0 ? 'tile-active' : 'tile-inactive'"
              @click="currentTileIndex === 0 ? selectMenu('warning') : null"
              @contextmenu="currentTileIndex === 0 ? handleRightClick : null"
            >
              <div 
                class="tile-icon-container"
                :class="currentTileIndex === 0 ? 'icon-active' : 'icon-inactive'"
              >
                <img 
                  src="/bell.svg" 
                  alt="WARNGERÄUSCH" 
                  class="tile-icon"
                  :class="currentTileIndex === 0 ? 'icon-inverted' : ''"
                />
              </div>
              <div 
                class="tile-text"
                :class="currentTileIndex === 0 ? 'text-active' : 'text-inactive'"
                :style="currentTileIndex === 0 ? 'color: white !important;' : ''"
              >
                WARNGERÄUSCH
              </div>
            </div>

            <!-- UNTERHALTEN -->
            <div 
              class="menu-tile"
              :class="currentTileIndex === 1 ? 'tile-active' : 'tile-inactive'"
              @click="currentTileIndex === 1 ? selectMenu('communication') : null"
              @contextmenu="currentTileIndex === 1 ? handleRightClick : null"
            >
              <div 
                class="tile-icon-container"
                :class="currentTileIndex === 1 ? 'icon-active' : 'icon-inactive'"
              >
                <img 
                  src="/comment-dots.svg" 
                  alt="UNTERHALTEN" 
                  class="tile-icon"
                  :class="currentTileIndex === 1 ? 'icon-inverted' : ''"
                />
              </div>
              <div 
                class="tile-text"
                :class="currentTileIndex === 1 ? 'text-active' : 'text-inactive'"
                :style="currentTileIndex === 1 ? 'color: white !important;' : ''"
              >
                UNTERHALTEN
              </div>
            </div>

            <!-- ICH -->
            <div 
              class="menu-tile"
              :class="currentTileIndex === 2 ? 'tile-active' : 'tile-inactive'"
              @click="currentTileIndex === 2 ? selectMenu('ich') : null"
              @contextmenu="currentTileIndex === 2 ? handleRightClick : null"
            >
              <div 
                class="tile-icon-container"
                :class="currentTileIndex === 2 ? 'icon-active' : 'icon-inactive'"
              >
                <img 
                  src="/user.svg" 
                  alt="ICH" 
                  class="tile-icon"
                  :class="currentTileIndex === 2 ? 'icon-inverted' : ''"
                />
              </div>
              <div 
                class="tile-text"
                :class="currentTileIndex === 2 ? 'text-active' : 'text-inactive'"
                :style="currentTileIndex === 2 ? 'color: white !important;' : ''"
              >
                ICH
              </div>
            </div>

            <!-- SCHMERZEN -->
            <div 
              class="menu-tile"
              :class="currentTileIndex === 3 ? 'tile-active' : 'tile-inactive'"
              @click="currentTileIndex === 3 ? selectMenu('pain') : null"
              @contextmenu="currentTileIndex === 3 ? handleRightClick : null"
            >
              <div 
                class="tile-icon-container"
                :class="currentTileIndex === 3 ? 'icon-active' : 'icon-inactive'"
              >
                <img 
                  src="/headache.svg" 
                  alt="SCHMERZEN" 
                  class="tile-icon"
                  :class="currentTileIndex === 3 ? 'icon-inverted' : ''"
                />
              </div>
              <div 
                class="tile-text"
                :class="currentTileIndex === 3 ? 'text-active' : 'text-inactive'"
                :style="currentTileIndex === 3 ? 'color: white !important;' : ''"
              >
                SCHMERZEN
              </div>
            </div>

            <!-- UMGEBUNG -->
            <div 
              class="menu-tile"
              :class="currentTileIndex === 4 ? 'tile-active' : 'tile-inactive'"
              @click="currentTileIndex === 4 ? selectMenu('environment') : null"
              @contextmenu="currentTileIndex === 4 ? handleRightClick : null"
            >
              <div 
                class="tile-icon-container"
                :class="currentTileIndex === 4 ? 'icon-active' : 'icon-inactive'"
              >
                <img 
                  src="/house-chimney.svg" 
                  alt="UMGEBUNG" 
                  class="tile-icon"
                  :class="currentTileIndex === 4 ? 'icon-inverted' : ''"
                />
              </div>
              <div 
                class="tile-text"
                :class="currentTileIndex === 4 ? 'text-active' : 'text-inactive'"
                :style="currentTileIndex === 4 ? 'color: white !important;' : ''"
              >
                UMGEBUNG
              </div>
            </div>

            <!-- EINSTELLUNGEN -->
            <div 
              class="menu-tile"
              :class="currentTileIndex === 5 ? 'tile-active' : 'tile-inactive'"
              @click="currentTileIndex === 5 ? selectMenu('settings') : null"
              @contextmenu="currentTileIndex === 5 ? handleRightClick : null"
            >
              <div 
                class="tile-icon-container"
                :class="currentTileIndex === 5 ? 'icon-active' : 'icon-inactive'"
              >
                <img 
                  src="/settings-sliders.svg" 
                  alt="EINSTELLUNGEN" 
                  class="tile-icon"
                  :class="currentTileIndex === 5 ? 'icon-inverted' : ''"
                />
              </div>
              <div 
                class="tile-text"
                :class="currentTileIndex === 5 ? 'text-active' : 'text-inactive'"
                :style="currentTileIndex === 5 ? 'color: white !important;' : ''"
              >
                EINSTELLUNGEN
              </div>
            </div>
        </div>

        <!-- Mobile Layout (Vertical Carousel) - wird nur auf Mobile angezeigt -->
        <div class="mobile-carousel" v-if="isMobile">
            <div 
              class="carousel-container" 
              :style="carouselStyle"
              @touchstart="handleTouchStart"
              @touchmove="handleTouchMove"
              @touchend="handleTouchEnd"
              role="listbox"
              aria-label="Hauptmenü"
              tabindex="0"
              @keydown="handleKeyboardNavigation"
            >
                <!-- WARNGERÄUSCH -->
                <div 
                  class="menu-tile"
                  :class="currentTileIndex === 0 ? 'tile-active' : 'tile-inactive'"
                  @click="currentTileIndex === 0 ? selectMenu('warning') : null"
                  @contextmenu="currentTileIndex === 0 ? handleRightClick : null"
                >
                  <div 
                    class="tile-icon-container"
                    :class="currentTileIndex === 0 ? 'icon-active' : 'icon-inactive'"
                  >
                    <img 
                      src="/bell.svg" 
                      alt="WARNGERÄUSCH" 
                      class="tile-icon"
                      :class="currentTileIndex === 0 ? 'icon-inverted' : ''"
                    />
                  </div>
                  <div 
                    class="tile-text"
                    :class="currentTileIndex === 0 ? 'text-active' : 'text-inactive'"
                    :style="currentTileIndex === 0 ? 'color: white !important;' : ''"
                  >
                    WARNGERÄUSCH
                  </div>
                </div>

                <!-- UNTERHALTEN -->
                <div 
                  class="menu-tile"
                  :class="currentTileIndex === 1 ? 'tile-active' : 'tile-inactive'"
                  @click="currentTileIndex === 1 ? selectMenu('communication') : null"
                  @contextmenu="currentTileIndex === 1 ? handleRightClick : null"
                >
                  <div 
                    class="tile-icon-container"
                    :class="currentTileIndex === 1 ? 'icon-active' : 'icon-inactive'"
                  >
                    <img 
                      src="/comment-dots.svg" 
                      alt="UNTERHALTEN" 
                      class="tile-icon"
                      :class="currentTileIndex === 1 ? 'icon-inverted' : ''"
                    />
                  </div>
                  <div 
                    class="tile-text"
                    :class="currentTileIndex === 1 ? 'text-active' : 'text-inactive'"
                    :style="currentTileIndex === 1 ? 'color: white !important;' : ''"
                  >
                    UNTERHALTEN
                  </div>
                </div>

                <!-- ICH -->
                <div 
                  class="menu-tile"
                  :class="currentTileIndex === 2 ? 'tile-active' : 'tile-inactive'"
                  @click="currentTileIndex === 2 ? selectMenu('ich') : null"
                  @contextmenu="currentTileIndex === 2 ? handleRightClick : null"
                >
                  <div 
                    class="tile-icon-container"
                    :class="currentTileIndex === 2 ? 'icon-active' : 'icon-inactive'"
                  >
                    <img 
                      src="/user.svg" 
                      alt="ICH" 
                      class="tile-icon"
                      :class="currentTileIndex === 2 ? 'icon-inverted' : ''"
                    />
                  </div>
                  <div 
                    class="tile-text"
                    :class="currentTileIndex === 2 ? 'text-active' : 'text-inactive'"
                    :style="currentTileIndex === 2 ? 'color: white !important;' : ''"
                  >
                    ICH
                  </div>
                </div>

                <!-- SCHMERZEN -->
                <div 
                  class="menu-tile"
                  :class="currentTileIndex === 3 ? 'tile-active' : 'tile-inactive'"
                  @click="currentTileIndex === 3 ? selectMenu('pain') : null"
                  @contextmenu="currentTileIndex === 3 ? handleRightClick : null"
                >
                  <div 
                    class="tile-icon-container"
                    :class="currentTileIndex === 3 ? 'icon-active' : 'icon-inactive'"
                  >
                    <img 
                      src="/headache.svg" 
                      alt="SCHMERZEN" 
                      class="tile-icon"
                      :class="currentTileIndex === 3 ? 'icon-inverted' : ''"
                    />
                  </div>
                  <div 
                    class="tile-text"
                    :class="currentTileIndex === 3 ? 'text-active' : 'text-inactive'"
                    :style="currentTileIndex === 3 ? 'color: white !important;' : ''"
                  >
                    SCHMERZEN
                  </div>
                </div>

                <!-- UMGEBUNG -->
                <div 
                  class="menu-tile"
                  :class="currentTileIndex === 4 ? 'tile-active' : 'tile-inactive'"
                  @click="currentTileIndex === 4 ? selectMenu('environment') : null"
                  @contextmenu="currentTileIndex === 4 ? handleRightClick : null"
                >
                  <div 
                    class="tile-icon-container"
                    :class="currentTileIndex === 4 ? 'icon-active' : 'icon-inactive'"
                  >
                    <img 
                      src="/house-chimney.svg" 
                      alt="UMGEBUNG" 
                      class="tile-icon"
                      :class="currentTileIndex === 4 ? 'icon-inverted' : ''"
                    />
                  </div>
                  <div 
                    class="tile-text"
                    :class="currentTileIndex === 4 ? 'text-active' : 'text-inactive'"
                    :style="currentTileIndex === 4 ? 'color: white !important;' : ''"
                  >
                    UMGEBUNG
                  </div>
                </div>

                <!-- EINSTELLUNGEN -->
                <div 
                  class="menu-tile"
                  :class="currentTileIndex === 5 ? 'tile-active' : 'tile-inactive'"
                  @click="currentTileIndex === 5 ? selectMenu('settings') : null"
                  @contextmenu="currentTileIndex === 5 ? handleRightClick : null"
                >
                  <div 
                    class="tile-icon-container"
                    :class="currentTileIndex === 5 ? 'icon-active' : 'icon-inactive'"
                  >
                    <img 
                      src="/settings-sliders.svg" 
                      alt="EINSTELLUNGEN" 
                      class="tile-icon"
                      :class="currentTileIndex === 5 ? 'icon-inverted' : ''"
                    />
                  </div>
                  <div 
                    class="tile-text"
                    :class="currentTileIndex === 5 ? 'text-active' : 'text-inactive'"
                    :style="currentTileIndex === 5 ? 'color: white !important;' : ''"
                  >
                    EINSTELLUNGEN
                  </div>
                </div>
            </div>
        </div>

    </main>
  </div>
</template>

<style scoped>
@import './HomeView.css';
</style>