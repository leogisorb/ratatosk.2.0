<template>
  <div 
    :class="tileClasses"
    :style="tileStyle"
    @click="handleClick"
    @touchstart="handleTouchStart"
    @touchmove="handleTouchMove"
    @touchend="handleTouchEnd"
    :role="role"
    :aria-label="ariaLabel"
    :aria-selected="isActive"
    :tabindex="tabindex"
    @keydown="handleKeydown"
  >
    <div :class="iconClasses">
      <img 
        :src="item.icon" 
        :alt="item.title" 
        class="tile-icon"
        :class="{ 'icon-inverted': isActive }"
        loading="lazy"
      />
    </div>
    <div :class="textClasses">
      {{ item.title }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { type CarouselItem } from '../config/carouselConfig'

interface Props {
  item: CarouselItem
  isActive: boolean
  isMobile?: boolean
  index: number
  onSelect?: (item: CarouselItem) => void
  onTouchStart?: (event: TouchEvent) => void
  onTouchMove?: (event: TouchEvent) => void
  onTouchEnd?: (event: TouchEvent) => void
}

const props = withDefaults(defineProps<Props>(), {
  isMobile: false,
  onSelect: () => {},
  onTouchStart: () => {},
  onTouchMove: () => {},
  onTouchEnd: () => {}
})

// Computed Properties
const tileClasses = computed(() => [
  props.isMobile ? 'carousel-tile' : 'menu-tile',
  props.isActive ? 'tile-active' : 'tile-inactive'
])

const iconClasses = computed(() => [
  'tile-icon-container',
  props.isActive ? 'icon-active' : 'icon-inactive'
])

const textClasses = computed(() => [
  'tile-text',
  props.isActive ? 'text-active' : 'text-inactive'
])

const tileStyle = computed(() => ({
  color: props.isActive ? 'white !important' : ''
}))

const role = computed(() => props.isMobile ? 'option' : 'button')
const ariaLabel = computed(() => `${props.item.title} auswählen`)
const tabindex = computed(() => props.isActive ? 0 : -1)

// Event Handlers
const handleClick = () => {
  console.log('Tile clicked:', props.item.title)
  props.onSelect(props.item)
}

const handleTouchStart = (event: TouchEvent) => {
  console.log('Tile touch start:', props.item.title)
  props.onTouchStart(event)
}

const handleTouchMove = (event: TouchEvent) => {
  props.onTouchMove(event)
}

const handleTouchEnd = (event: TouchEvent) => {
  console.log('Tile touch end:', props.item.title)
  props.onTouchEnd(event)
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    handleClick()
  }
}
</script>

<style scoped>
/* Tile Base Styles */
.menu-tile,
.carousel-tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 1rem;
  box-sizing: border-box;
  position: relative;
  z-index: 1;
  user-select: none;
  margin: 0 auto;
  width: 85%;
  max-width: 450px;
  height: 360px;
  padding: 1.5rem;
  border: 3px solid transparent;
  background-color: var(--bg-secondary);
  margin-bottom: 2rem;
}

/* Desktop Grid Tile */
.menu-tile {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 1rem;
}

/* Mobile Carousel Tile */
.carousel-tile {
  width: 85%;
  max-width: 450px;
  height: 360px;
  margin-bottom: 2rem;
}

/* Hover Effects */
.menu-tile:hover,
.carousel-tile:hover {
  transform: scale(1.02);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}

.menu-tile:active,
.carousel-tile:active {
  transform: scale(0.98);
}

/* Active/Inactive States */
.tile-active {
  background-color: #00B098 !important;
  border: 3px solid #00B098 !important;
  box-shadow: 0 15px 35px rgba(0, 176, 152, 0.3);
  transform: scale(1.05);
}

.tile-inactive {
  background-color: var(--bg-secondary);
  border: 3px solid var(--border-primary);
  opacity: 0.6;
  transform: scale(0.95);
}

/* Icon Container */
.tile-icon-container {
  width: 80px;
  height: 80px;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.tile-icon {
  width: 50px;
  height: 50px;
  transition: all 0.3s ease;
  object-fit: contain;
}

/* Text Styles */
.tile-text {
  text-align: center;
  font-family: 'Source Code Pro', monospace;
  transition: all 0.3s ease;
  font-weight: 600;
  font-size: 1.2rem;
}

.text-active {
  color: white !important;
}

.text-inactive {
  color: var(--text-primary);
}

.icon-active {
  background-color: transparent;
  border: none;
}

.icon-inactive {
  background-color: transparent;
  border: none;
}

/* Accessibility */
.menu-tile:focus,
.carousel-tile:focus {
  outline: 2px solid #00B098;
  outline-offset: 2px;
}

/* Mobile Optimizations */
@media (max-width: 768px) {
  .carousel-tile {
    width: 90%;
    max-width: 400px;
    height: 320px;
  }
  
  .tile-text {
    font-size: 1.1rem;
  }
}
</style>
