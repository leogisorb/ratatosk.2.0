<template>
  <div class="message-list">
    <div v-if="isLoading" class="loading">
      Nachrichten werden geladen...
    </div>
    
    <div v-else-if="error" class="error">
      Fehler: {{ error }}
    </div>
    
    <div v-else class="messages">
      <div
        v-for="message in messages"
        :key="message.id"
        :class="['message', `message--${message.type}`]"
      >
        <div class="message__content">
          {{ message.content }}
        </div>
        <div class="message__meta">
          <span class="message__type">{{ getTypeLabel(message.type) }}</span>
          <span class="message__time">{{ formatTime(message.timestamp) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Message } from '../../../core/domain/entities/Message'

interface Props {
  messages: Message[]
  isLoading?: boolean
  error?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
  error: null
})

function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    user: 'Benutzer',
    system: 'System',
    quick: 'Schnell',
    pain_assessment: 'Schmerz'
  }
  return labels[type] || type
}

function formatTime(timestamp: Date): string {
  return new Intl.DateTimeFormat('de-DE', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(timestamp)
}
</script>

<style scoped>
.message-list {
  @apply max-h-96 overflow-y-auto p-4;
}

.loading, .error {
  @apply text-center py-4;
}

.error {
  @apply text-red-600;
}

.messages {
  @apply space-y-2;
}

.message {
  @apply p-3 rounded-lg border;
}

.message--user {
  @apply bg-blue-50 border-blue-200;
}

.message--system {
  @apply bg-gray-50 border-gray-200;
}

.message--quick {
  @apply bg-green-50 border-green-200;
}

.message--pain_assessment {
  @apply bg-red-50 border-red-200;
}

.message__content {
  @apply text-sm;
}

.message__meta {
  @apply flex justify-between items-center mt-2 text-xs text-gray-500;
}

.message__type {
  @apply font-medium;
}
</style>
