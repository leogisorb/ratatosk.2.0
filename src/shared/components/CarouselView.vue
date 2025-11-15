<template>
  <div class="carousel-view-container">
    <!-- Karussell Wrapper für vertikale Zentrierung -->
    <div class="carousel-wrapper">
      <!-- Karussell Container -->
      <div class="carousel-container">
        <!-- Karussell Content -->
        <div class="carousel-content">
          <div 
            v-for="(item, index) in items"
            :key="item.id"
            class="carousel-item"
            :class="currentIndex === index ? 'carousel-item-active' : 'carousel-item-inactive'"
            :style="getItemStyle(index)"
            @click="handleItemClick(item, index)"
            @contextmenu.prevent="handleContextMenu(item, index)"
          >
            <div 
              :ref="currentIndex === index ? (el) => { if (el) containerRef = el as HTMLElement } : undefined"
              class="carousel-item-content"
            >
              <!-- Icon Container -->
              <div 
                class="tile-icon-container"
                :class="currentIndex === index ? 'icon-active' : 'icon-inactive'"
                :style="iconContainerStyle"
              >
                <!-- Emoji -->
                <div 
                  v-if="hasEmoji(item)" 
                  class="tile-emoji"
                  :style="emojiStyle"
                >
                  {{ item.emoji }}
                </div>
                <!-- Icon/SVG -->
                <img 
                  v-else-if="hasIcon(item)" 
                  :src="item.icon" 
                  :alt="item.title" 
                  class="tile-icon"
                  :class="currentIndex === index ? 'icon-inverted' : ''"
                  :style="iconStyle"
                />
              </div>
              
              <!-- Title -->
              <div 
                class="tile-text"
                :class="currentIndex === index ? 'text-active' : 'text-inactive'"
                :style="currentIndex === index ? { ...textStyle, ...activeTextStyle } : textStyle"
              >
                {{ item.title }}
              </div>
              
              <!-- Description (optional) -->
              <div 
                v-if="item.description"
                class="tile-description"
                :class="currentIndex === index ? 'text-active' : 'text-inactive'"
                :style="currentIndex === index ? { ...textStyle, ...activeTextStyle, fontSize: `${textFontSize * 0.9}px` } : { ...textStyle, fontSize: `${textFontSize * 0.9}px` }"
              >
                {{ item.description }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Karussell Indicators -->
    <div class="carousel-indicators">
      <button 
        v-for="(item, index) in items"
        :key="`indicator-${item.id}`"
        class="carousel-indicator"
        :class="currentIndex === index ? 'carousel-indicator-active' : 'carousel-indicator-inactive'"
        :aria-label="`Go to item ${index + 1}: ${item.title}`"
        :aria-current="currentIndex === index ? 'true' : 'false'"
      >
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch, nextTick } from 'vue'
import { useCarouselSizing } from '../../shared/composables/useCarouselSizing'
import { debugCarousel, debugComponent } from '../../shared/utils/debug'

/**
 * Flexible Carousel Item Interface
 * Supports emoji, icon (SVG/image), title, and optional description
 */
export interface CarouselItem {
  id: string
  title: string
  emoji?: string
  icon?: string
  description?: string
  [key: string]: any // Allow additional properties for flexibility
}

interface Props {
  /** Array of carousel items to display */
  items: CarouselItem[]
  /** Current active index */
  currentIndex: number
  /** Callback when an item is clicked */
  onItemClick?: (item: CarouselItem, index: number) => void
  /** Callback when context menu is triggered on an item */
  onContextMenu?: (item: CarouselItem, index: number) => void
  /** Rotation angle for inactive items (default: 20deg) */
  rotationAngle?: number
}

const props = withDefaults(defineProps<Props>(), {
  onItemClick: undefined,
  onContextMenu: undefined,
  rotationAngle: 20
})

// Responsive Sizing Composable
const {
  containerRef,
  iconContainerStyle,
  iconStyle,
  emojiStyle,
  textStyle,
  activeTextStyle,
  textFontSize,
  updateContainerSize
} = useCarouselSizing()

// Watch for currentIndex changes to update container size
watch(() => props.currentIndex, async (newIndex, oldIndex) => {
  // Debug: Log index change
  if (oldIndex !== undefined) {
    debugCarousel.indexChange(oldIndex, newIndex, props.items.length)
  }
  
  await nextTick()
  updateContainerSize()
})

/**
 * Computed style for carousel item based on its position relative to current index
 */
const getItemStyle = (index: number) => {
  const offset = index - props.currentIndex
  const rotation = offset < 0 
    ? -props.rotationAngle 
    : offset > 0 
      ? props.rotationAngle 
      : 0
  
  return {
    '--offset': offset,
    '--rotation': `${rotation}deg`
  }
}

/**
 * Check if item has an emoji
 */
const hasEmoji = (item: CarouselItem): boolean => {
  return !!item.emoji
}

/**
 * Check if item has an icon
 */
const hasIcon = (item: CarouselItem): boolean => {
  return !!item.icon && typeof item.icon === 'string'
}

/**
 * Handle item click event
 */
const handleItemClick = (item: CarouselItem, index: number) => {
  // Debug: Log item click
  debugCarousel.itemClick(item, index)
  
  if (props.onItemClick) {
    props.onItemClick(item, index)
  }
}

/**
 * Handle context menu event
 */
const handleContextMenu = (item: CarouselItem, index: number) => {
  if (props.onContextMenu) {
    props.onContextMenu(item, index)
  }
}
</script>

<style scoped>
@import '../../shared/styles/DialogBase.css';
</style>
