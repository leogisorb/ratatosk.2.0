/**
 * Daten-Modul: Pain Levels
 * Enthält die Schmerzskala (1-10)
 */

// Pain levels (1-10)
export const painLevels = [
  { id: 1, level: 1, title: 'Eins', description: 'kein Schmerz' },
  { id: 2, level: 2, title: 'Zwei', description: 'sehr leicht' },
  { id: 3, level: 3, title: 'Drei', description: 'leicht' },
  { id: 4, level: 4, title: 'Vier', description: 'leicht bis mäßig' },
  { id: 5, level: 5, title: 'Fünf', description: 'mäßig' },
  { id: 6, level: 6, title: 'Sechs', description: 'mäßig bis stark' },
  { id: 7, level: 7, title: 'Sieben', description: 'stark' },
  { id: 8, level: 8, title: 'Acht', description: 'sehr stark' },
  { id: 9, level: 9, title: 'Neun', description: 'extrem stark' },
  { id: 10, level: 10, title: 'Zehn', description: 'unerträglich' }
] as const

// Helper function to get pain description by level
export const getPainDescription = (level: number): string => {
  const painLevel = painLevels.find(p => p.level === level)
  return painLevel ? painLevel.description : ''
}

// Helper function to get pain level by ID
export const getPainLevelById = (id: number) => {
  return painLevels.find(p => p.id === id)
}

// Helper function to get pain level by level
export const getPainLevelByLevel = (level: number) => {
  return painLevels.find(p => p.level === level)
}

