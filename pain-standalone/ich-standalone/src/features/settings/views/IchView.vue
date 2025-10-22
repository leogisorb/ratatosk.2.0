<script setup lang="ts">
// Import external JavaScript logic
import { useIchViewLogic } from './IchView.ts'
import AppHeader from '../../../shared/components/AppHeader.vue'

// Use the composable function
const {
  currentMenu,
  isAutoMode,
  closedFrames,
  eyesClosed,
  blinkThreshold,
  lastBlinkTime,
  blinkCooldown,
  menuItems,
  appClasses,
  speakText,
  selectMenu,
  formatTime,
  handleFaceBlink,
  handleRightClick,
  settingsStore,
  faceRecognition,
  gridContainer,
  
  // Karussell-System für Mobile
  isMobile,
  position,
  carouselStyle,
  currentItem,
  itemCount,
  autoScrollState,
  touchState,
  isSwipe,
  swipeDirection,
  navigateToIndex,
  navigateNext,
  navigatePrevious,
  handleCarouselTouchStart,
  handleCarouselTouchMove,
  handleCarouselTouchEnd,
  startAutoScrollWithCallback,
  stopAutoScrollCompletely,
  checkIsMobile,
  currentTileIndex
} = useIchViewLogic()
</script>

<template>
  <div id="app" :class="appClasses" class="ich-view">
    <!-- App Header -->
    <AppHeader />

    <!-- Hauptinhalt -->
    <main class="main-content">
      <!-- Haupttext über den Kacheln -->
      <div class="main-text-container">
        <h1 class="main-text">Was möchten Sie machen?</h1>
      </div>
      
      <!-- Desktop Layout (3×2 Grid) - wird auf Desktop angezeigt -->
      <div class="grid-container desktop-grid" ref="gridContainer" v-show="!isMobile">
        <!-- ERNÄHRUNG -->
        <div 
          class="menu-tile"
          :class="currentTileIndex === 0 ? 'tile-active' : 'tile-inactive'"
          @click="selectMenu('ernaehrung')"
        >
          <div 
            class="tile-icon-container"
            :class="currentTileIndex === 0 ? 'icon-active' : 'icon-inactive'"
            >
              <svg class="tile-icon" :class="currentTileIndex === 0 ? 'icon-inverted' : ''" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="512" height="512" fill="currentColor">
                <path d="M19,12H16.386l.54-4.331A3.017,3.017,0,0,0,14,4.017H11.631c.109-.771.043-2.007,1.134-2.012H16a1,1,0,1,0,0-2H12.765A3,3,0,0,0,9.79,2.633L9.617,4.017H3A3.021,3.021,0,0,0,.059,7.572L1.572,19.63a5.005,5.005,0,0,0,4.959,4.376L19,23.994a5,5,0,0,0,5-5V17A5,5,0,0,0,19,12Zm3,5H10a3,3,0,0,1,3-3h6A3,3,0,0,1,22,17ZM14,6.016a1.011,1.011,0,0,1,.96,1.311L14.873,8h-3.74l.248-1.986ZM2.224,6.39A1,1,0,0,1,3,6.016H9.367L9.118,8H2.124l-.1-.77A.993.993,0,0,1,2.224,6.39ZM3.556,19.382,2.376,10H14.623l-.251,2H13a5,5,0,0,0-5,5c-.042,1.634-.1,3.74,1.036,5.01H6.531A3,3,0,0,1,3.556,19.382ZM19,22H13a3,3,0,0,1-3-3h3.7c.387.186,2.875,2.111,3.3,2,.416.118,2.93-1.823,3.3-2H22A3,3,0,0,1,19,22Z"/>
              </svg>
            </div>
            <div 
            class="tile-text"
            :class="currentTileIndex === 0 ? 'text-active' : 'text-inactive'"
            >
              ERNÄHRUNG
            </div>
          </div>

          <!-- GEFÜHLE -->
          <div 
          class="menu-tile"
          :class="currentTileIndex === 1 ? 'tile-active' : 'tile-inactive'"
            @click="selectMenu('gefuehle')"
          >
            <div 
            class="tile-icon-container"
            :class="currentTileIndex === 1 ? 'icon-active' : 'icon-inactive'"
            >
              <svg class="tile-icon" :class="currentTileIndex === 1 ? 'icon-inverted' : ''" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="512" height="512" fill="currentColor">
                <path d="M12,0C5.383,0,0,5.383,0,12s5.383,12,12,12,12-5.383,12-12S18.617,0,12,0Zm0,22c-5.514,0-10-4.486-10-10S6.486,2,12,2s10,4.486,10,10-4.486,10-10,10Zm5.666-13.746c.412,.368,.448,1,.08,1.412-.197,.221-.471,.334-.746,.334-.237,0-.475-.084-.666-.254-.018-.016-2.003-1.746-4.334-1.746s-4.316,1.73-4.336,1.748c-.413,.366-1.044,.328-1.411-.084-.366-.412-.331-1.042,.081-1.409,.103-.092,2.559-2.254,5.666-2.254s5.563,2.162,5.666,2.254Zm-.666,6.246c0,.828-.672,1.5-1.5,1.5s-1.5-.672-1.5-1.5,.672-1.5,1.5-1.5,1.5,.672,1.5,1.5Zm-7,0c0,.828-.672,1.5-1.5,1.5s-1.5-.672-1.5-1.5,.672-1.5,1.5-1.5,1.5,.672,1.5,1.5Z"/>
              </svg>
            </div>
            <div 
            class="tile-text"
            :class="currentTileIndex === 1 ? 'text-active' : 'text-inactive'"
            >
              GEFÜHLE
            </div>
          </div>

          <!-- KLEIDUNG -->
          <div 
          class="menu-tile"
          :class="currentTileIndex === 2 ? 'tile-active' : 'tile-inactive'"
            @click="selectMenu('kleidung')"
          >
            <div 
            class="tile-icon-container"
            :class="currentTileIndex === 2 ? 'icon-active' : 'icon-inactive'"
            >
              <svg class="tile-icon" :class="currentTileIndex === 2 ? 'icon-inverted' : ''" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="512" height="512" fill="currentColor">
                <path d="m22.751,17.411l-9.108-6.47c2.639-2.166,3.844-3.16,3.175-6.087-.417-1.822-1.862-3.268-3.684-3.684-1.514-.345-3.068,0-4.259.952-1.192.95-1.875,2.369-1.875,3.891,0,.552.448,1,1,1s1-.448,1-1c0-.911.409-1.759,1.122-2.328.724-.578,1.635-.779,2.568-.565,1.061.242,1.937,1.118,2.179,2.179.383,1.678.148,1.927-2.505,4.106l-.968.799L1.222,17.431c-.765.583-1.222,1.506-1.222,2.467,0,1.71,1.392,3.102,3.102,3.102h17.796c1.71,0,3.102-1.392,3.102-3.102,0-.961-.457-1.884-1.249-2.487Zm-1.853,3.589H3.102c-.608,0-1.102-.494-1.102-1.102,0-.341.163-.669.407-.856l9.593-6.815,9.565,6.795c.272.207.435.535.435.876,0,.608-.494,1.102-1.102,1.102Z"/>
              </svg>
            </div>
            <div 
            class="tile-text"
            :class="currentTileIndex === 2 ? 'text-active' : 'text-inactive'"
            >
              KLEIDUNG
            </div>
          </div>

          <!-- HYGIENE -->
          <div 
          class="menu-tile"
          :class="currentTileIndex === 3 ? 'tile-active' : 'tile-inactive'"
            @click="selectMenu('hygiene')"
          >
            <div 
            class="tile-icon-container"
            :class="currentTileIndex === 3 ? 'icon-active' : 'icon-inactive'"
            >
              <svg class="tile-icon" :class="currentTileIndex === 3 ? 'icon-inverted' : ''" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="512" height="512" fill="currentColor">
                <path d="m23.249,13.015c-.569-.645-1.389-1.015-2.249-1.015H2v-7.518c0-.841.38-1.673,1.093-2.12,1.089-.683,2.419-.347,3.107.571l.259.345-.483,2.771c-.058.334.011.678.194.963.425.662,1.323.824,1.952.352l3.606-2.704c.567-.425.71-1.217.327-1.814l-.013-.021c-.237-.37-.64-.602-1.079-.622l-2.906-.129-.174-.232c-.658-.877-1.593-1.542-2.669-1.755C2.44-.462,0,1.656,0,4.333c0,0,.004,5.71.006,7.923,0,.576.037,1.145.108,1.717.101.809.237,1.9.237,1.9.251,2.005,1.223,3.767,2.635,5.037l-.457,1.85c-.133.536.194,1.078.73,1.211.081.02.161.029.241.029.449,0,.857-.305.97-.76l.277-1.121c1.109.564,2.36.881,3.676.881h7.417c1.223,0,2.39-.273,3.44-.765l.249,1.005c.112.455.521.76.97.76.08,0,.16-.01.241-.029.536-.133.863-.675.73-1.211l-.41-1.66c1.53-1.282,2.591-3.12,2.854-5.226l.062-.501c.106-.854-.158-1.712-.728-2.357Zm-1.257,2.109l-.062.501c-.383,3.064-3.001,5.375-6.089,5.375h-7.417c-3.088,0-5.705-2.311-6.088-5.375l-.203-1.625h18.867c.291,0,.558.12.75.338.192.219.278.497.242.786Z"/>
              </svg>
            </div>
            <div 
            class="tile-text"
            :class="currentTileIndex === 3 ? 'text-active' : 'text-inactive'"
            >
              HYGIENE
            </div>
          </div>

          <!-- BEWEGUNG -->
          <div 
          class="menu-tile"
          :class="currentTileIndex === 4 ? 'tile-active' : 'tile-inactive'"
            @click="selectMenu('bewegung')"
          >
            <div 
            class="tile-icon-container"
            :class="currentTileIndex === 4 ? 'icon-active' : 'icon-inactive'"
            >
              <svg class="tile-icon" :class="currentTileIndex === 4 ? 'icon-inverted' : ''" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="512" height="512" fill="currentColor">
                <path d="M24,22c0,1.103-.897,2-2,2h-6.146c-1.738,0-3.398-.764-4.556-2.096-3.156-3.635-5.98-6.04-7.557-6.435-2.343-.585-3.742-2.179-3.742-4.263,0-1.775,1.028-2.626,1.854-3.31,.488-.404,.949-.786,1.242-1.355L5.988,.554c.24-.498,.837-.705,1.335-.466,.497,.24,.706,.838,.465,1.335l-2.904,6.012c-.492,.956-1.193,1.537-1.757,2.004-.782,.647-1.128,.968-1.128,1.769,0,1.46,1.211,2.069,2.227,2.323,2.723,.68,6.545,4.717,8.582,7.062,.777,.895,1.888,1.407,3.046,1.407h4.085c-.924,0-1.772-.402-2.326-1.104-1.598-2.023-2.653-4.172-3.584-6.067-.613-1.248-1.191-2.427-1.856-3.441-.789-1.206-.909-2.673-.32-3.924L15.095,.574c.235-.501,.832-.713,1.331-.479,.5,.235,.714,.831,.479,1.331l-3.242,6.889c-.291,.617-.222,1.356,.185,1.977,.731,1.119,1.336,2.351,1.977,3.655,.931,1.895,1.893,3.854,3.359,5.71,.17,.216,.453,.344,.756,.344h2.06c1.103,0,2,.897,2,2Z"/>
              </svg>
            </div>
            <div 
            class="tile-text"
            :class="currentTileIndex === 4 ? 'text-active' : 'text-inactive'"
            >
              BEWEGUNG
            </div>
          </div>

          <!-- ZURÜCK -->
          <div 
          class="menu-tile"
          :class="currentTileIndex === 5 ? 'tile-active' : 'tile-inactive'"
            @click="selectMenu('zurueck')"
          >
            <div 
            class="tile-icon-container"
            :class="currentTileIndex === 5 ? 'icon-active' : 'icon-inactive'"
            >
              <svg class="tile-icon" :class="currentTileIndex === 5 ? 'icon-inverted' : ''" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 425 379" fill="currentColor">
                <path d="M363.37 346.611C354.792 352.015 346.792 357.788 338.104 362.205C321.53 370.63 303.94 376.562 285.23 377.239C260.981 378.117 236.679 378.701 212.436 378.059C200.9 377.753 191.875 368.261 191.36 354.8C190.938 343.759 196.838 333.802 209.431 330.48C212.563 329.654 215.926 329.428 219.186 329.409C236.684 329.309 254.189 329.672 271.679 329.286C296.066 328.748 317.451 320.164 336.415 304.743C348.137 295.211 357.188 283.678 363.996 270.504C373.326 252.452 376.995 232.89 375.01 212.719C372.851 190.797 364.71 171.15 350.435 154.002C333.182 133.279 311.014 121.52 284.941 116.491C280.438 115.622 275.75 115.412 271.147 115.407C211.32 115.338 151.494 115.362 91.6672 115.362C89.6738 115.362 87.6804 115.362 84.6129 115.362C88.7354 121.609 92.4584 127.218 96.1458 132.85C98.8285 136.947 101.804 140.899 104.055 145.224C110.266 157.158 105.998 169.084 97.8994 175.848C87.6288 184.427 72.1281 183.488 63.4676 173.976C54.307 163.915 45.8233 153.228 37.229 142.664C28.3528 131.753 19.6996 120.661 10.9481 109.648C8.09518 106.058 5.01596 102.623 2.43625 98.8463C-1.93958 92.4403 -0.313717 85.8209 6.45287 77.4987C19.6083 61.3189 32.508 44.9313 45.5172 28.6325C51.0486 21.7025 56.0763 14.2755 62.2612 7.98729C69.2244 0.907735 78.4629 -1.55493 88.1199 0.957341C98.0237 3.53381 104.265 10.0516 106.288 20.5823C107.688 27.8683 105.968 34.0721 102.039 39.99C96.4361 48.4281 90.8338 56.8665 84.5299 66.3613C87.1274 66.3613 88.97 66.3613 90.8126 66.3613C152.139 66.3612 213.467 66.1418 274.791 66.4865C294.789 66.599 313.923 71.7866 332.231 79.8868C348.88 87.2527 363.944 97.168 376.866 109.852C387.196 119.992 396.193 131.373 403.575 144.036C413.671 161.353 420.23 179.956 422.893 199.582C425.829 221.226 424.866 242.89 418.853 264.229C412.909 285.323 403.309 304.52 389.437 321.261C381.825 330.448 372.3 338.051 363.37 346.611Z"/>
              </svg>
            </div>
            <div 
            class="tile-text"
            :class="currentTileIndex === 5 ? 'text-active' : 'text-inactive'"
            >
              ZURÜCK
          </div>
        </div>
      </div>

      <!-- Mobile Layout (Vertical Carousel) - wird nur auf Mobile angezeigt -->
      <div class="mobile-carousel" v-if="isMobile">
        <div 
          class="carousel-container" 
          :style="carouselStyle"
          @touchstart="handleCarouselTouchStart"
          @touchmove="handleCarouselTouchMove"
          @touchend="handleCarouselTouchEnd"
          role="listbox"
          aria-label="Hauptmenü"
          tabindex="0"
          @keydown="handleKeyboardNavigation"
        >
          <!-- ERNÄHRUNG -->
          <div 
            class="carousel-tile"
            :class="currentTileIndex === 0 ? 'tile-active' : 'tile-inactive'"
            @click="selectMenu('ernaehrung')"
          >
            <div 
              class="tile-icon-container"
              :class="currentTileIndex === 0 ? 'icon-active' : 'icon-inactive'"
            >
              <img 
                src="/hamburger-soda.svg" 
                alt="ERNÄHRUNG" 
                class="tile-icon"
                :class="currentTileIndex === 0 ? 'icon-inverted' : ''"
              />
            </div>
            <div 
              class="tile-text"
              :class="currentTileIndex === 0 ? 'text-active' : 'text-inactive'"
            >
              ERNÄHRUNG
            </div>
          </div>

          <!-- GEFÜHLE -->
          <div 
            class="carousel-tile"
            :class="currentTileIndex === 1 ? 'tile-active' : 'tile-inactive'"
            @click="selectMenu('gefuehle')"
          >
            <div 
              class="tile-icon-container"
              :class="currentTileIndex === 1 ? 'icon-active' : 'icon-inactive'"
            >
              <img 
                src="/face-smile-upside-down.svg" 
                alt="GEFÜHLE" 
                class="tile-icon"
                :class="currentTileIndex === 1 ? 'icon-inverted' : ''"
              />
            </div>
            <div 
              class="tile-text"
              :class="currentTileIndex === 1 ? 'text-active' : 'text-inactive'"
            >
              GEFÜHLE
            </div>
          </div>

          <!-- KLEIDUNG -->
          <div 
            class="carousel-tile"
            :class="currentTileIndex === 2 ? 'tile-active' : 'tile-inactive'"
            @click="selectMenu('kleidung')"
          >
            <div 
              class="tile-icon-container"
              :class="currentTileIndex === 2 ? 'icon-active' : 'icon-inactive'"
            >
              <img 
                src="/clothes-hanger.svg" 
                alt="KLEIDUNG" 
                class="tile-icon"
                :class="currentTileIndex === 2 ? 'icon-inverted' : ''"
              />
            </div>
            <div 
              class="tile-text"
              :class="currentTileIndex === 2 ? 'text-active' : 'text-inactive'"
            >
              KLEIDUNG
            </div>
          </div>

          <!-- HYGIENE -->
          <div 
            class="carousel-tile"
            :class="currentTileIndex === 3 ? 'tile-active' : 'tile-inactive'"
            @click="selectMenu('hygiene')"
          >
            <div 
              class="tile-icon-container"
              :class="currentTileIndex === 3 ? 'icon-active' : 'icon-inactive'"
            >
              <img 
                src="/bath.svg" 
                alt="HYGIENE" 
                class="tile-icon"
                :class="currentTileIndex === 3 ? 'icon-inverted' : ''"
              />
            </div>
            <div 
              class="tile-text"
              :class="currentTileIndex === 3 ? 'text-active' : 'text-inactive'"
            >
              HYGIENE
            </div>
          </div>

          <!-- BEWEGUNG -->
          <div 
            class="carousel-tile"
            :class="currentTileIndex === 4 ? 'tile-active' : 'tile-inactive'"
            @click="selectMenu('bewegung')"
          >
            <div 
              class="tile-icon-container"
              :class="currentTileIndex === 4 ? 'icon-active' : 'icon-inactive'"
            >
              <img 
                src="/barefoot.svg" 
                alt="BEWEGUNG" 
                class="tile-icon"
                :class="currentTileIndex === 4 ? 'icon-inverted' : ''"
              />
            </div>
            <div 
              class="tile-text"
              :class="currentTileIndex === 4 ? 'text-active' : 'text-inactive'"
            >
              BEWEGUNG
            </div>
          </div>

          <!-- ZURÜCK -->
          <div 
            class="carousel-tile"
            :class="currentTileIndex === 5 ? 'tile-active' : 'tile-inactive'"
            @click="selectMenu('zurueck')"
          >
            <div 
              class="tile-icon-container"
              :class="currentTileIndex === 5 ? 'icon-active' : 'icon-inactive'"
            >
              <img 
                src="/zurueck.svg" 
                alt="ZURÜCK" 
                class="tile-icon"
                :class="currentTileIndex === 5 ? 'icon-inverted' : ''"
              />
            </div>
            <div 
              class="tile-text"
              :class="currentTileIndex === 5 ? 'text-active' : 'text-inactive'"
            >
              ZURÜCK
            </div>
          </div>
        </div>
      </div>

    </main>
  </div>
</template>

<style src="./IchView.css"></style>