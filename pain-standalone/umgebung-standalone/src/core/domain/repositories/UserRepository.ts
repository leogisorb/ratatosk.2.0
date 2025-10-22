import type { User } from '../entities/User'

/**
 * User Repository Interface
 * Defines the contract for user data operations
 */
export interface UserRepository {
  findById(id: string): Promise<User | null>
  save(user: User): Promise<User>
  update(id: string, updates: Partial<User>): Promise<User>
  delete(id: string): Promise<void>
  findAll(): Promise<User[]>
}

/**
 * User Repository Implementation for Local Storage
 */
export class LocalUserRepository implements UserRepository {
  private readonly STORAGE_KEY = 'ratatosk-user'

  async findById(id: string): Promise<User | null> {
    const users = await this.getAllUsers()
    return users.find(user => user.id === id) || null
  }

  async save(user: User): Promise<User> {
    const users = await this.getAllUsers()
    const existingIndex = users.findIndex(u => u.id === user.id)
    
    if (existingIndex >= 0) {
      users[existingIndex] = user
    } else {
      users.push(user)
    }
    
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(users))
    return user
  }

  async update(id: string, updates: Partial<User>): Promise<User> {
    const user = await this.findById(id)
    if (!user) {
      throw new Error(`User with id ${id} not found`)
    }
    
    const updatedUser = { ...user, ...updates, updatedAt: new Date() }
    return this.save(updatedUser)
  }

  async delete(id: string): Promise<void> {
    const users = await this.getAllUsers()
    const filteredUsers = users.filter(user => user.id !== id)
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredUsers))
  }

  async findAll(): Promise<User[]> {
    return this.getAllUsers()
  }

  private async getAllUsers(): Promise<User[]> {
    const stored = localStorage.getItem(this.STORAGE_KEY)
    if (!stored) return []
    
    try {
      return JSON.parse(stored)
    } catch {
      return []
    }
  }
}
