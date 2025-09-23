<template>
  <div class="communication-view">
    <div class="communication-header">
      <h1 class="text-2xl font-bold mb-4">Kommunikation</h1>
      <BaseButton 
        variant="secondary" 
        size="sm"
        @click="clearAllMessages"
        :loading="isLoading"
      >
        Alle Nachrichten löschen
      </BaseButton>
    </div>

    <div class="communication-content">
      <MessageList 
        :messages="recentMessages"
        :is-loading="isLoading"
        :error="error"
      />
      
      <div class="message-input">
        <div class="input-group">
          <input
            v-model="newMessage"
            type="text"
            placeholder="Nachricht eingeben..."
            class="input-field"
            @keyup.enter="sendMessage"
            :disabled="isLoading"
          />
          <BaseButton 
            variant="primary"
            @click="sendMessage"
            :loading="isLoading"
            :disabled="!newMessage.trim()"
          >
            Senden
          </BaseButton>
        </div>
      </div>

      <div v-if="hasErrors" class="error-section">
        <div v-for="[key, message] in errorList" :key="key" class="error-item">
          {{ message }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCommunication } from '../composables/useCommunication'
import { useErrorHandling } from '../../../shared/composables/useErrorHandling'
import MessageList from '../components/MessageList.vue'
import BaseButton from '../../../shared/components/BaseButton.vue'

const router = useRouter()

// Composables
const {
  messages,
  isLoading,
  error,
  recentMessages,
  loadMessages,
  sendMessage: sendMessageService,
  clearMessages
} = useCommunication()

const {
  hasErrors,
  errorList,
  withErrorHandling,
  clearAllErrors
} = useErrorHandling()

// Local state
const newMessage = ref('')
const currentUserId = 'default-user' // In real app, get from auth

// Computed
const hasMessages = computed(() => recentMessages.value.length > 0)

// Methods
async function sendMessage() {
  if (!newMessage.value.trim()) return

  const message = newMessage.value.trim()
  newMessage.value = ''

  await withErrorHandling(async () => {
    await sendMessageService(message, 'user', currentUserId)
  }, 'send-message')
}

async function clearAllMessages() {
  await withErrorHandling(async () => {
    await clearMessages(currentUserId)
    clearAllErrors()
  }, 'clear-messages')
}

// Lifecycle
onMounted(async () => {
  await withErrorHandling(async () => {
    await loadMessages(currentUserId)
  }, 'load-messages')
})
</script>

<style scoped>
.communication-view {
  @apply max-w-4xl mx-auto p-6;
}

.communication-header {
  @apply flex justify-between items-center mb-6;
}

.communication-content {
  @apply space-y-6;
}

.message-input {
  @apply border-t pt-6;
}

.input-group {
  @apply flex gap-2;
}

.input-field {
  @apply flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500;
}

.error-section {
  @apply bg-red-50 border border-red-200 rounded-lg p-4;
}

.error-item {
  @apply text-red-600 text-sm;
}
</style>
