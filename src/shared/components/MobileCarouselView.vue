<template>
  <div class="mobile-carousel">
    <div 
      class="carousel-container" 
      :style="carouselStyle"
      @touchstart="handleTouchStart"
      @touchmove="handleTouchMove"
      @touchend="handleTouchEnd"
      role="listbox"
      aria-label="Hauptmenü"
      tabindex="0"
    >
      <div 
        v-for="(item, index) in items"
        :key="item.id"
        class="menu-tile"
        :class="[
          currentIndex === index ? 'tile-active' : 'tile-inactive',
          isBackItem(item) ? 'back-tile' : ''
        ]"
        :style="{ '--offset': index - currentIndex }"
        @click="handleItemClick(item, index)"
        @contextmenu.prevent="handleContextMenu(item, index)"
      >
        <div 
          class="tile-icon-container"
          :class="currentIndex === index ? 'icon-active' : 'icon-inactive'"
        >
          <img 
            v-if="hasIcon(item)" 
            :src="getIcon(item)" 
            :alt="getTitle(item)" 
            class="tile-icon"
            :class="currentIndex === index ? 'icon-inverted' : ''"
          />
        </div>
        <div 
          class="tile-text"
          :class="currentIndex === index ? 'text-active' : 'text-inactive'"
          :style="currentIndex === index ? 'color: white !important;' : ''"
        >
          {{ getTitle(item) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CSSProperties } from 'vue'

// Flexible item type - accepts any object with id, title, and optional icon
interface MobileCarouselItem {
  id: string
  title: string
  icon?: string
  [key: string]: any // Allow additional properties
}

interface Props {
  items: MobileCarouselItem[]
  currentIndex: number
  carouselStyle?: CSSProperties
  onItemClick?: (item: MobileCarouselItem, index: number) => void
  onContextMenu?: (item: MobileCarouselItem, index: number) => void
  onTouchStart?: (event: TouchEvent) => void
  onTouchMove?: (event: TouchEvent) => void
  onTouchEnd?: (event: TouchEvent) => void
  isBackItem?: (item: MobileCarouselItem) => boolean
  backId?: string
}

const props = withDefaults(defineProps<Props>(), {
  carouselStyle: undefined,
  onItemClick: undefined,
  onContextMenu: undefined,
  onTouchStart: undefined,
  onTouchMove: undefined,
  onTouchEnd: undefined,
  isBackItem: undefined,
  backId: undefined
})

// Helper functions
const hasIcon = (item: MobileCarouselItem): boolean => {
  return 'icon' in item && !!item.icon
}

const getIcon = (item: MobileCarouselItem): string => {
  return typeof item.icon === 'string' ? item.icon : ''
}

const getTitle = (item: MobileCarouselItem): string => {
  return item.title || ''
}

const isBackItem = (item: MobileCarouselItem): boolean => {
  if (props.isBackItem) {
    return props.isBackItem(item)
  }
  if (props.backId) {
    return item.id === props.backId
  }
  return item.id === 'zurueck' || item.id === 'back' || item.id === 'zurück'
}

const handleItemClick = (item: MobileCarouselItem, index: number) => {
  if (props.onItemClick) {
    props.onItemClick(item, index)
  }
}

const handleContextMenu = (item: MobileCarouselItem, index: number) => {
  if (props.onContextMenu) {
    props.onContextMenu(item, index)
  }
}

const handleTouchStart = (event: TouchEvent) => {
  if (props.onTouchStart) {
    props.onTouchStart(event)
  }
}

const handleTouchMove = (event: TouchEvent) => {
  if (props.onTouchMove) {
    props.onTouchMove(event)
  }
}

const handleTouchEnd = (event: TouchEvent) => {
  if (props.onTouchEnd) {
    props.onTouchEnd(event)
  }
}
</script>

<style scoped>
@import '../../shared/styles/DialogBase.css';
</style>

