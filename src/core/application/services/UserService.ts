import type { User, UserPreferences, AccessibilitySettings } from '../../domain/entities/User'
import type { UserRepository } from '../../domain/repositories/UserRepository'

/**
 * User Application Service
 * Handles user-related business logic and use cases
 */
export class UserService {
  constructor(private userRepository: UserRepository) {}

  /**
   * Get user by ID
   */
  async getUser(id: string): Promise<User | null> {
    return this.userRepository.findById(id)
  }

  /**
   * Create a new user
   */
  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const user: User = {
      ...userData,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    return this.userRepository.save(user)
  }

  /**
   * Update user preferences
   */
  async updatePreferences(userId: string, preferences: Partial<UserPreferences>): Promise<User> {
    const user = await this.userRepository.findById(userId)
    if (!user) {
      throw new Error(`User with id ${userId} not found`)
    }

    const updatedUser = {
      ...user,
      preferences: { ...user.preferences, ...preferences },
      updatedAt: new Date()
    }

    return this.userRepository.save(updatedUser)
  }

  /**
   * Update accessibility settings
   */
  async updateAccessibilitySettings(userId: string, settings: Partial<AccessibilitySettings>): Promise<User> {
    const user = await this.userRepository.findById(userId)
    if (!user) {
      throw new Error(`User with id ${userId} not found`)
    }

    const updatedUser = {
      ...user,
      accessibility: { ...user.accessibility, ...settings },
      updatedAt: new Date()
    }

    return this.userRepository.save(updatedUser)
  }

  /**
   * Get or create default user
   */
  async getOrCreateDefaultUser(): Promise<User> {
    const users = await this.userRepository.findAll()
    
    if (users.length > 0) {
      return users[0] // Return first user (assuming single user app)
    }

    // Create default user
    return this.createUser({
      name: 'Default User',
      preferences: {
        theme: 'light',
        language: 'de',
        soundEnabled: true,
        voiceEnabled: false,
        autoModeSpeed: 3000,
        blinkSensitivity: 0.5
      },
      accessibility: {
        highContrast: false,
        largeText: false,
        reducedMotion: false,
        keyboardLayout: 'alphabetical'
      }
    })
  }

  /**
   * Reset user to default settings
   */
  async resetToDefaults(userId: string): Promise<User> {
    const user = await this.userRepository.findById(userId)
    if (!user) {
      throw new Error(`User with id ${userId} not found`)
    }

    const defaultUser = {
      ...user,
      preferences: {
        theme: 'light',
        language: 'de',
        soundEnabled: true,
        voiceEnabled: false,
        autoModeSpeed: 3000,
        blinkSensitivity: 0.5
      },
      accessibility: {
        highContrast: false,
        largeText: false,
        reducedMotion: false,
        keyboardLayout: 'alphabetical'
      },
      updatedAt: new Date()
    }

    return this.userRepository.save(defaultUser)
  }

  private generateId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}
