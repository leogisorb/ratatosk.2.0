/**
 * Message Domain Entity
 * Represents a communication message in the system
 */
export interface Message {
  id: string
  content: string
  type: MessageType
  category?: MessageCategory
  timestamp: Date
  userId: string
  metadata?: MessageMetadata
}

export type MessageType = 'user' | 'system' | 'quick' | 'pain_assessment'

export type MessageCategory = 'greeting' | 'pain' | 'need' | 'feeling' | 'medical'

export interface MessageMetadata {
  painLevel?: number
  bodyPart?: string
  emotion?: string
  urgency?: 'low' | 'medium' | 'high'
}
