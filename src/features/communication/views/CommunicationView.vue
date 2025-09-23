<template>
  <div class="communication-view">
    <div class="communication-header">
      <h1 class="text-2xl font-bold mb-4">Kommunikation</h1>
      <button 
        @click="clearAllMessages"
        :disabled="isLoading"
        class="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg disabled:opacity-50"
      >
        Alle Nachrichten löschen
      </button>
    </div>

    <div class="communication-content">
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
        
        <div v-if="messages.length === 0" class="no-messages">
          Noch keine Nachrichten vorhanden.
        </div>
      </div>
      
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
          <button 
            @click="sendMessage"
            :disabled="isLoading || !newMessage.trim()"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
          >
            Senden
          </button>
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
import { ref, onMounted } from 'vue'
import type { Message } from '../../../core/domain/entities/Message'

// Local state
const messages = ref<Message[]>([])
const newMessage = ref('')
const isLoading = ref(false)
const error = ref<string | null>(null)
const currentUserId = 'default-user'

// Methods
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

async function sendMessage() {
  if (!newMessage.value.trim()) return

  const message: Message = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    content: newMessage.value.trim(),
    type: 'user',
    timestamp: new Date(),
    userId: currentUserId
  }

  messages.value.push(message)
  newMessage.value = ''
}

async function clearAllMessages() {
  messages.value = []
}

// Lifecycle
onMounted(() => {
  // Load some sample messages
  const sampleMessages: Message[] = [
    {
      id: '1',
      content: 'Hallo, wie geht es Ihnen?',
      type: 'user',
      timestamp: new Date(Date.now() - 60000),
      userId: currentUserId
    },
    {
      id: '2',
      content: 'Ich habe Schmerzen im Kopf',
      type: 'pain_assessment',
      timestamp: new Date(Date.now() - 30000),
      userId: currentUserId
    }
  ]
  
  messages.value = sampleMessages
})
</script>

<style scoped>
.communication-view {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px;
}

.communication-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.communication-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.loading, .error {
  text-align: center;
  padding: 16px;
}

.error {
  color: #dc2626;
}

.messages {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  background: #f9fafb;
}

.message {
  padding: 12px;
  margin-bottom: 8px;
  border-radius: 8px;
  border: 1px solid;
}

.message--user {
  background: #dbeafe;
  border-color: #93c5fd;
}

.message--system {
  background: #f3f4f6;
  border-color: #d1d5db;
}

.message--quick {
  background: #dcfce7;
  border-color: #86efac;
}

.message--pain_assessment {
  background: #fef2f2;
  border-color: #fca5a5;
}

.message__content {
  font-size: 14px;
  margin-bottom: 4px;
}

.message__meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #6b7280;
}

.message__type {
  font-weight: 500;
}

.no-messages {
  text-align: center;
  color: #6b7280;
  padding: 24px;
}

.message-input {
  border-top: 1px solid #e5e7eb;
  padding-top: 24px;
}

.input-group {
  display: flex;
  gap: 8px;
}

.input-field {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  outline: none;
}

.input-field:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.error-section {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 16px;
}

.error-item {
  color: #dc2626;
  font-size: 14px;
}
</style>
