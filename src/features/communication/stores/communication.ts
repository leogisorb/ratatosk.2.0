import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Message } from '../../../shared/types/index'
import { createMessageId, createUserId } from '../../../core/domain/types/Branded'
import { MESSAGE_TYPES } from '../../../core/domain/entities/Message'

// Legacy QuickMessage format for UI (simplified, not full Domain Entity)
interface QuickMessageItem {
  id: string
  text: string
  category: 'greeting' | 'pain' | 'need' | 'feeling'
  icon?: string
}

export const useCommunicationStore = defineStore('communication', () => {
  // State
  const messages = ref<Message[]>([])
  const currentMessage = ref('')
  const quickMessages = ref<QuickMessageItem[]>([
    {
      id: '1',
      text: 'Hallo!',
      category: 'greeting',
      icon: '👋'
    },
    {
      id: '2',
      text: 'Ich habe Schmerzen',
      category: 'pain',
      icon: '😣'
    },
    {
      id: '3',
      text: 'Ich brauche Hilfe',
      category: 'need',
      icon: '🆘'
    },
    {
      id: '4',
      text: 'Mir geht es gut',
      category: 'feeling',
      icon: '😊'
    },
    {
      id: '5',
      text: 'Ich bin müde',
      category: 'feeling',
      icon: '😴'
    },
    {
      id: '6',
      text: 'Ich bin durstig',
      category: 'need',
      icon: '💧'
    },
    {
      id: '7',
      text: 'Ich bin hungrig',
      category: 'need',
      icon: '🍽️'
    },
    {
      id: '8',
      text: 'Auf Wiedersehen!',
      category: 'greeting',
      icon: '👋'
    }
  ])

  // Getters
  const messageCount = computed(() => messages.value.length)
  const lastMessage = computed(() => messages.value[messages.value.length - 1])

  const messagesByCategory = computed(() => {
    const grouped = {
      greeting: [] as QuickMessageItem[],
      pain: [] as QuickMessageItem[],
      need: [] as QuickMessageItem[],
      feeling: [] as QuickMessageItem[]
    }
    
    quickMessages.value.forEach(msg => {
      grouped[msg.category].push(msg)
    })
    
    return grouped
  })

  // Actions
  function addMessage(text: string, type: Message['type'] = MESSAGE_TYPES.USER) {
    // Create a UserMessage with proper branded types
    const message: Message = {
      id: createMessageId(Date.now().toString()),
      content: text,
      timestamp: Date.now(), // Unix timestamp in milliseconds
      userId: createUserId('default-user'), // TODO: Use actual user ID
      type: MESSAGE_TYPES.USER,
      category: 'feeling' // Default category
    }
    messages.value.push(message)
    saveMessages()
  }

  function addQuickMessage(messageId: string) {
    const quickMessage = quickMessages.value.find(msg => msg.id === messageId)
    if (quickMessage) {
      // Create a QuickMessage with proper branded types
      const message: Message = {
        id: createMessageId(Date.now().toString()),
        content: quickMessage.text,
        timestamp: Date.now(),
        userId: createUserId('default-user'), // TODO: Use actual user ID
        type: MESSAGE_TYPES.QUICK,
        category: quickMessage.category
      }
      messages.value.push(message)
      saveMessages()
    }
  }

  function updateCurrentMessage(text: string) {
    currentMessage.value = text
  }

  function sendCurrentMessage() {
    if (currentMessage.value.trim()) {
      addMessage(currentMessage.value.trim())
      currentMessage.value = ''
    }
  }

  function clearMessages() {
    messages.value = []
    saveMessages()
  }

  function deleteMessage(messageId: string) {
    const index = messages.value.findIndex(msg => msg.id === messageId)
    if (index > -1) {
      messages.value.splice(index, 1)
      saveMessages()
    }
  }

  function saveMessages() {
    localStorage.setItem('ratatosk-messages', JSON.stringify(messages.value))
  }

  function loadMessages() {
    const saved = localStorage.getItem('ratatosk-messages')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        // Convert legacy format to new format if needed
        messages.value = parsed.map((msg: any) => {
          // Handle legacy format with 'text' instead of 'content'
          const content = msg.content || msg.text || ''
          const timestamp = typeof msg.timestamp === 'number' 
            ? msg.timestamp 
            : new Date(msg.timestamp).getTime()
          
          return {
            ...msg,
            id: typeof msg.id === 'string' ? createMessageId(msg.id) : createMessageId(String(msg.id)),
            content,
            timestamp,
            userId: typeof msg.userId === 'string' ? createUserId(msg.userId) : createUserId('default-user'),
            type: msg.type || MESSAGE_TYPES.USER,
            category: msg.category || 'feeling'
          } as Message
        })
      } catch (error) {
        console.error('Failed to load messages:', error)
      }
    }
  }

  // Initialize
  loadMessages()

  return {
    // State
    messages,
    currentMessage,
    quickMessages,
    
    // Getters
    messageCount,
    lastMessage,
    messagesByCategory,
    
    // Actions
    addMessage,
    addQuickMessage,
    updateCurrentMessage,
    sendCurrentMessage,
    clearMessages,
    deleteMessage,
    saveMessages,
    loadMessages
  }
}) 