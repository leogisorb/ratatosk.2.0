// Communication Store for ich-standalone
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCommunicationStore = defineStore('communication', () => {
  // State
  const isConnected = ref(false)
  const lastMessage = ref('')
  const messageHistory = ref<string[]>([])
  const isTyping = ref(false)
  
  // Computed
  const hasMessages = computed(() => messageHistory.value.length > 0)
  const lastMessageTime = ref<Date | null>(null)

  // Actions
  const sendMessage = (message: string) => {
    messageHistory.value.push(message)
    lastMessage.value = message
    lastMessageTime.value = new Date()
  }

  const clearHistory = () => {
    messageHistory.value = []
    lastMessage.value = ''
    lastMessageTime.value = null
  }

  const setConnectionStatus = (connected: boolean) => {
    isConnected.value = connected
  }

  const setTyping = (typing: boolean) => {
    isTyping.value = typing
  }

  return {
    // State
    isConnected,
    lastMessage,
    messageHistory,
    isTyping,
    hasMessages,
    lastMessageTime,
    
    // Actions
    sendMessage,
    clearHistory,
    setConnectionStatus,
    setTyping
  }
})
