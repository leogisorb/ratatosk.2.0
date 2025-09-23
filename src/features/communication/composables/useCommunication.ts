import { ref, computed } from 'vue'
import type { Message, MessageType, MessageCategory } from '../../../core/domain/entities/Message'
import { CommunicationService } from '../../../core/application/services/CommunicationService'
import { LocalMessageRepository } from '../../../core/domain/repositories/MessageRepository'

/**
 * Communication Composable
 * Provides reactive communication functionality
 */
export function useCommunication() {
  // Dependencies
  const messageRepository = new LocalMessageRepository()
  const communicationService = new CommunicationService(messageRepository)

  // State
  const messages = ref<Message[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Computed
  const recentMessages = computed(() => 
    messages.value
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 20)
  )

  const messageCount = computed(() => messages.value.length)

  const messagesByType = computed(() => {
    return messages.value.reduce((acc, msg) => {
      acc[msg.type] = (acc[msg.type] || 0) + 1
      return acc
    }, {} as Record<MessageType, number>)
  })

  // Actions
  async function loadMessages(userId: string) {
    try {
      isLoading.value = true
      error.value = null
      messages.value = await communicationService.getRecentMessages(userId)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load messages'
    } finally {
      isLoading.value = false
    }
  }

  async function sendMessage(
    content: string,
    type: MessageType,
    userId: string,
    category?: MessageCategory,
    metadata?: any
  ) {
    try {
      isLoading.value = true
      error.value = null
      
      const message = await communicationService.sendMessage(
        content,
        type,
        userId,
        category,
        metadata
      )
      
      messages.value.push(message)
      return message
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to send message'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function sendQuickMessage(
    content: string,
    category: MessageCategory,
    userId: string
  ) {
    return sendMessage(content, 'quick', userId, category)
  }

  async function sendSystemMessage(
    content: string,
    userId: string,
    metadata?: any
  ) {
    return sendMessage(content, 'system', userId, undefined, metadata)
  }

  async function sendPainAssessment(
    painLevel: number,
    bodyPart: string,
    userId: string,
    description?: string
  ) {
    try {
      isLoading.value = true
      error.value = null
      
      const message = await communicationService.sendPainAssessmentMessage(
        painLevel,
        bodyPart,
        userId,
        description
      )
      
      messages.value.push(message)
      return message
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to send pain assessment'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function clearMessages(userId: string) {
    try {
      isLoading.value = true
      error.value = null
      
      await communicationService.clearUserMessages(userId)
      messages.value = []
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to clear messages'
    } finally {
      isLoading.value = false
    }
  }

  async function getMessageStats(userId: string) {
    try {
      return await communicationService.getMessageStats(userId)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to get message stats'
      throw err
    }
  }

  return {
    // State
    messages: readonly(messages),
    isLoading: readonly(isLoading),
    error: readonly(error),
    
    // Computed
    recentMessages,
    messageCount,
    messagesByType,
    
    // Actions
    loadMessages,
    sendMessage,
    sendQuickMessage,
    sendSystemMessage,
    sendPainAssessment,
    clearMessages,
    getMessageStats
  }
}
