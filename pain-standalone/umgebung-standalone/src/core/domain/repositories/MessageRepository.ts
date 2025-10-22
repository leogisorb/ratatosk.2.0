import type { Message } from '../entities/Message'

/**
 * Message Repository Interface
 * Defines the contract for message data operations
 */
export interface MessageRepository {
  findById(id: string): Promise<Message | null>
  findByUserId(userId: string): Promise<Message[]>
  save(message: Message): Promise<Message>
  update(id: string, updates: Partial<Message>): Promise<Message>
  delete(id: string): Promise<void>
  findRecent(limit?: number): Promise<Message[]>
  findByCategory(category: string): Promise<Message[]>
}

/**
 * Message Repository Implementation for Local Storage
 */
export class LocalMessageRepository implements MessageRepository {
  private readonly STORAGE_KEY = 'ratatosk-messages'

  async findById(id: string): Promise<Message | null> {
    const messages = await this.getAllMessages()
    return messages.find(message => message.id === id) || null
  }

  async findByUserId(userId: string): Promise<Message[]> {
    const messages = await this.getAllMessages()
    return messages.filter(message => message.userId === userId)
  }

  async save(message: Message): Promise<Message> {
    const messages = await this.getAllMessages()
    const existingIndex = messages.findIndex(m => m.id === message.id)
    
    if (existingIndex >= 0) {
      messages[existingIndex] = message
    } else {
      messages.push(message)
    }
    
    // Keep only last 1000 messages to prevent storage bloat
    const recentMessages = messages.slice(-1000)
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(recentMessages))
    return message
  }

  async update(id: string, updates: Partial<Message>): Promise<Message> {
    const message = await this.findById(id)
    if (!message) {
      throw new Error(`Message with id ${id} not found`)
    }
    
    const updatedMessage = { ...message, ...updates }
    return this.save(updatedMessage)
  }

  async delete(id: string): Promise<void> {
    const messages = await this.getAllMessages()
    const filteredMessages = messages.filter(message => message.id !== id)
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredMessages))
  }

  async findRecent(limit: number = 50): Promise<Message[]> {
    const messages = await this.getAllMessages()
    return messages
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)
  }

  async findByCategory(category: string): Promise<Message[]> {
    const messages = await this.getAllMessages()
    return messages.filter(message => message.category === category)
  }

  private async getAllMessages(): Promise<Message[]> {
    const stored = localStorage.getItem(this.STORAGE_KEY)
    if (!stored) return []
    
    try {
      const parsed = JSON.parse(stored)
      return parsed.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }))
    } catch {
      return []
    }
  }
}
