/**
 * Message Domain Entity
 * Represents a communication message in the system
 */
import type { MessageId, UserId, PainLevel } from '../types/Branded'
import type { BodyPartId } from '../types/BodyPart'

// Const assertions for message types
export const MESSAGE_TYPES = {
  USER: 'user',
  SYSTEM: 'system',
  QUICK: 'quick',
  PAIN_ASSESSMENT: 'pain_assessment'
} as const

export type MessageType = typeof MESSAGE_TYPES[keyof typeof MESSAGE_TYPES]

export type MessageCategory = 'greeting' | 'pain' | 'need' | 'feeling' | 'medical'

// Discriminated Union for type safety
export type Message = 
  | UserMessage
  | SystemMessage
  | QuickMessage
  | PainAssessmentMessage

// Base message interface
interface BaseMessage {
  readonly id: MessageId
  content: string
  readonly timestamp: number // Unix timestamp in milliseconds
  readonly userId: UserId
}

// User message - requires category
export interface UserMessage extends BaseMessage {
  type: typeof MESSAGE_TYPES.USER
  category: MessageCategory
  metadata?: UserMessageMetadata
}

// System message - no category
export interface SystemMessage extends BaseMessage {
  type: typeof MESSAGE_TYPES.SYSTEM
  category?: never
  metadata?: SystemMessageMetadata
}

// Quick message - requires category
export interface QuickMessage extends BaseMessage {
  type: typeof MESSAGE_TYPES.QUICK
  category: MessageCategory
  metadata?: QuickMessageMetadata
}

// Pain assessment message - category is always 'pain'
export interface PainAssessmentMessage extends BaseMessage {
  type: typeof MESSAGE_TYPES.PAIN_ASSESSMENT
  category: 'pain'
  metadata: PainAssessmentMessageMetadata
}

// Message metadata types
export interface UserMessageMetadata {
  emotion?: string
  urgency?: 'low' | 'medium' | 'high'
}

export interface SystemMessageMetadata {
  systemEvent?: string
  urgency?: 'low' | 'medium' | 'high'
}

export interface QuickMessageMetadata {
  emotion?: string
  urgency?: 'low' | 'medium' | 'high'
}

export interface PainAssessmentMessageMetadata {
  painLevel: PainLevel // 0-10 scale, required for pain assessments
  bodyPart: BodyPartId
  emotion?: string
  urgency?: 'low' | 'medium' | 'high'
}

// Legacy interface for backwards compatibility (deprecated)
/** @deprecated Use discriminated union types instead */
export interface MessageMetadata {
  painLevel?: PainLevel
  bodyPart?: BodyPartId
  emotion?: string
  urgency?: 'low' | 'medium' | 'high'
}
