// IchDialogService - Based on PainAssessmentService
// Handles data persistence and business logic for ich-dialog

export interface IchDialogData {
  id: string
  category: string
  subcategory: string
  description: string
  intensity: 'niedrig' | 'mittel' | 'hoch'
  date: string
  timestamp: number
}

export class IchDialogService {
  private static instance: IchDialogService
  private data: IchDialogData[] = []

  private constructor() {
    this.loadData()
  }

  public static getInstance(): IchDialogService {
    if (!IchDialogService.instance) {
      IchDialogService.instance = new IchDialogService()
    }
    return IchDialogService.instance
  }

  // Save data to localStorage
  public saveData(data: IchDialogData): void {
    this.data.push(data)
    this.persistData()
    console.log('IchDialog data saved:', data)
  }

  // Get all data
  public getAllData(): IchDialogData[] {
    return [...this.data]
  }

  // Get data by category
  public getDataByCategory(category: string): IchDialogData[] {
    return this.data.filter(item => item.category === category)
  }

  // Get data by subcategory
  public getDataBySubcategory(category: string, subcategory: string): IchDialogData[] {
    return this.data.filter(item => 
      item.category === category && item.subcategory === subcategory
    )
  }

  // Get data by date range
  public getDataByDateRange(startDate: string, endDate: string): IchDialogData[] {
    const start = new Date(startDate).getTime()
    const end = new Date(endDate).getTime()
    
    return this.data.filter(item => {
      const itemDate = new Date(item.date).getTime()
      return itemDate >= start && itemDate <= end
    })
  }

  // Get statistics
  public getStatistics(): {
    totalEntries: number
    categoryCounts: Record<string, number>
    intensityCounts: Record<string, number>
    recentEntries: IchDialogData[]
  } {
    const categoryCounts: Record<string, number> = {}
    const intensityCounts: Record<string, number> = {}
    
    this.data.forEach(item => {
      categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1
      intensityCounts[item.intensity] = (intensityCounts[item.intensity] || 0) + 1
    })

    const recentEntries = this.data
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10)

    return {
      totalEntries: this.data.length,
      categoryCounts,
      intensityCounts,
      recentEntries
    }
  }

  // Export data
  public exportData(): string {
    return JSON.stringify(this.data, null, 2)
  }

  // Import data
  public importData(jsonData: string): boolean {
    try {
      const importedData = JSON.parse(jsonData)
      if (Array.isArray(importedData)) {
        this.data = importedData
        this.persistData()
        return true
      }
      return false
    } catch (error) {
      console.error('Error importing data:', error)
      return false
    }
  }

  // Clear all data
  public clearData(): void {
    this.data = []
    this.persistData()
  }

  // Load data from localStorage
  private loadData(): void {
    try {
      const stored = localStorage.getItem('ich-dialog-data')
      if (stored) {
        this.data = JSON.parse(stored)
      }
    } catch (error) {
      console.error('Error loading data from localStorage:', error)
      this.data = []
    }
  }

  // Persist data to localStorage
  private persistData(): void {
    try {
      localStorage.setItem('ich-dialog-data', JSON.stringify(this.data))
    } catch (error) {
      console.error('Error saving data to localStorage:', error)
    }
  }
}

// Export singleton instance
export const ichDialogService = IchDialogService.getInstance()
