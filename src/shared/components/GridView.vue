<template>
  <div class="grid-container desktop-grid">
    <div 
      v-for="(item, index) in items"
      :key="item.id"
      class="menu-tile"
      :class="[
        currentIndex === index ? 'tile-active' : 'tile-inactive',
        isBackItem(item) ? 'back-tile' : ''
      ]"
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
</template>

<script setup lang="ts">
// Flexible item type - accepts any object with id, title, and optional icon
interface GridItem {
  id: string
  title: string
  icon?: string
  [key: string]: any // Allow additional properties
}

interface Props {
  items: GridItem[]
  currentIndex: number
  onItemClick?: (item: GridItem, index: number) => void
  onContextMenu?: (item: GridItem, index: number) => void
  isBackItem?: (item: GridItem) => boolean
  backId?: string
}

const props = withDefaults(defineProps<Props>(), {
  onItemClick: undefined,
  onContextMenu: undefined,
  isBackItem: undefined,
  backId: undefined
})

// Helper functions
const hasIcon = (item: GridItem): boolean => {
  return 'icon' in item && !!item.icon
}

const getIcon = (item: GridItem): string => {
  return typeof item.icon === 'string' ? item.icon : ''
}

const getTitle = (item: GridItem): string => {
  return item.title || ''
}

const isBackItem = (item: GridItem): boolean => {
  if (props.isBackItem) {
    return props.isBackItem(item)
  }
  if (props.backId) {
    return item.id === props.backId
  }
  return item.id === 'zurueck' || item.id === 'back' || item.id === 'zurück'
}

const handleItemClick = (item: GridItem, index: number) => {
  if (props.onItemClick) {
    props.onItemClick(item, index)
  }
}

const handleContextMenu = (item: GridItem, index: number) => {
  if (props.onContextMenu) {
    props.onContextMenu(item, index)
  }
}
</script>

<style scoped>
@import '../../shared/styles/DialogBase.css';
</style>

