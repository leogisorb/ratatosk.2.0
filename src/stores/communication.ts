import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Message, QuickMessage } from '@/types'

export const useCommunicationStore = defineStore('communication', () => {
  // State
  const messages = ref<Message[]>([])
  const currentMessage = ref('')
  const quickMessages = ref<QuickMessage[]>([
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
      greeting: [] as QuickMessage[],
      pain: [] as QuickMessage[],
      need: [] as QuickMessage[],
      feeling: [] as QuickMessage[]
    }
    
    quickMessages.value.forEach(msg => {
      grouped[msg.category].push(msg)
    })
    
    return grouped
  })

  // Actions
  function addMessage(text: string, type: Message['type'] = 'user') {
    const message: Message = {
      id: Date.now().toString(),
      text,
      timestamp: new Date(),
      type
    }
    messages.value.push(message)
    saveMessages()
  }

  function addQuickMessage(messageId: string) {
    const quickMessage = quickMessages.value.find(msg => msg.id === messageId)
    if (quickMessage) {
      addMessage(quickMessage.text, 'quick')
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
        messages.value = parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
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