import type { Message, MessageType, MessageCategory } from '../../domain/entities/Message'
import type { MessageRepository } from '../../domain/repositories/MessageRepository'

/**
 * Communication Application Service
 * Handles communication-related business logic
 */
export class CommunicationService {
  constructor(private messageRepository: MessageRepository) {}

  /**
   * Send a new message
   */
  async sendMessage(
    content: string,
    type: MessageType,
    userId: string,
    category?: MessageCategory,
    metadata?: any
  ): Promise<Message> {
    const message: Message = {
      id: this.generateId(),
      content,
      type,
      category,
      timestamp: new Date(),
      userId,
      metadata
    }

    return this.messageRepository.save(message)
  }

  /**
   * Get recent messages for a user
   */
  async getRecentMessages(userId: string, limit: number = 50): Promise<Message[]> {
    const allMessages = await this.messageRepository.findByUserId(userId)
    return allMessages
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)
  }

  /**
   * Get messages by category
   */
  async getMessagesByCategory(category: MessageCategory): Promise<Message[]> {
    return this.messageRepository.findByCategory(category)
  }

  /**
   * Send quick message (predefined messages)
   */
  async sendQuickMessage(
    content: string,
    category: MessageCategory,
    userId: string
  ): Promise<Message> {
    return this.sendMessage(content, 'quick', userId, category)
  }

  /**
   * Send system message
   */
  async sendSystemMessage(
    content: string,
    userId: string,
    metadata?: any
  ): Promise<Message> {
    return this.sendMessage(content, 'system', userId, undefined, metadata)
  }

  /**
   * Send pain assessment message
   */
  async sendPainAssessmentMessage(
    painLevel: number,
    bodyPart: string,
    userId: string,
    description?: string
  ): Promise<Message> {
    const content = `Schmerz: ${painLevel}/10 - ${bodyPart}${description ? ` - ${description}` : ''}`
    
    return this.sendMessage(
      content,
      'pain_assessment',
      userId,
      'pain',
      {
        painLevel,
        bodyPart,
        description
      }
    )
  }

  /**
   * Clear all messages for a user
   */
  async clearUserMessages(userId: string): Promise<void> {
    const messages = await this.messageRepository.findByUserId(userId)
    for (const message of messages) {
      await this.messageRepository.delete(message.id)
    }
  }

  /**
   * Get message statistics
   */
  async getMessageStats(userId: string): Promise<{
    total: number
    byType: Record<MessageType, number>
    byCategory: Record<string, number>
    recentActivity: Date | null
  }> {
    const messages = await this.messageRepository.findByUserId(userId)
    
    const byType = messages.reduce((acc, msg) => {
      acc[msg.type] = (acc[msg.type] || 0) + 1
      return acc
    }, {} as Record<MessageType, number>)

    const byCategory = messages.reduce((acc, msg) => {
      if (msg.category) {
        acc[msg.category] = (acc[msg.category] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)

    const recentActivity = messages.length > 0 
      ? messages.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0].timestamp
      : null

    return {
      total: messages.length,
      byType,
      byCategory,
      recentActivity
    }
  }

  private generateId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}
