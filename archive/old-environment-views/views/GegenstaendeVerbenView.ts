// GegenstaendeVerbenView TypeScript Logic
// Diese Datei enthält die TypeScript-Logik für die GegenstaendeVerbenView
// Die Logik ist bereits in der .vue Datei integriert

export interface GegenstandVerbenItem {
  id: string
  text: string
  type: 'verb' | 'navigation'
  emoji: string
}

export interface GegenstandVerbenState {
  currentTileIndex: number
  selectedVerb: string
  selectedGegenstand: string
  isAutoMode: boolean
  autoModeInterval: number | null
  closedFrames: number
  eyesClosed: boolean
  isAutoModePaused: boolean
  restartTimeout: number | null
}

// Gegenstände-Verben-Items mit passenden Emojis
export const gegenstaendeVerbenItems: GegenstandVerbenItem[] = [
  { id: 'benutzen', text: 'benutzen', type: 'verb', emoji: '👆' },
  { id: 'halten', text: 'halten', type: 'verb', emoji: '🤏' },
  { id: 'legen', text: 'legen', type: 'verb', emoji: '📦' },
  { id: 'nehmen', text: 'nehmen', type: 'verb', emoji: '✋' },
  { id: 'geben', text: 'geben', type: 'verb', emoji: '🤲' },
  { id: 'aufheben', text: 'aufheben', type: 'verb', emoji: '⬆️' },
  { id: 'reinigen', text: 'reinigen', type: 'verb', emoji: '🧼' },
  { id: 'weglegen', text: 'weglegen', type: 'verb', emoji: '📦' },
  { id: 'finden', text: 'finden', type: 'verb', emoji: '🔍' },
  { id: 'bringen', text: 'bringen', type: 'verb', emoji: '📦' },
  { id: 'zurück', text: 'zurück', type: 'navigation', emoji: '⬅️' }
]

// Umlaut-Mapping für URL-Parameter
export const umlautMap: { [key: string]: string } = {
  'handy': 'Handy',
  'glas': 'Glas',
  'brille': 'Brille',
  'stift': 'Stift',
  'papier': 'Papier',
  'lineal': 'Lineal',
  'teller': 'Teller',
  'besteck': 'Besteck',
  'tisch': 'Tisch'
}
