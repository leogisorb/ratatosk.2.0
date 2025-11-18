/**
 * Daten-Modul: Pain Levels
 * Enthält die Schmerzskala (1-10) mit individuellen Farben
 */

// Pain levels (1-10) mit kühlem, klarem Farbverlauf von Grün bis Rot
export const painLevels = [
  { id: 1, level: 1, title: 'Eins', description: 'kein Schmerz', color: '#5FAF84' }, // kühles Grün
  { id: 2, level: 2, title: 'Zwei', description: 'sehr leicht', color: '#72B383' },
  { id: 3, level: 3, title: 'Drei', description: 'leicht', color: '#86B781' },
  { id: 4, level: 4, title: 'Vier', description: 'leicht bis mäßig', color: '#99BB7F' },
  { id: 5, level: 5, title: 'Fünf', description: 'mäßig', color: '#ADBF7D' }, // Übergang Richtung neutral
  { id: 6, level: 6, title: 'Sechs', description: 'mäßig bis stark', color: '#C1A96F' },
  { id: 7, level: 7, title: 'Sieben', description: 'stark', color: '#D58F61' },
  { id: 8, level: 8, title: 'Acht', description: 'sehr stark', color: '#E87453' }, // kühles Orange-Rot
  { id: 9, level: 9, title: 'Neun', description: 'extrem stark', color: '#DA594A' },
  { id: 10, level: 10, title: 'Zehn', description: 'unerträglich', color: '#CB3E40' } // kühles Rot
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

