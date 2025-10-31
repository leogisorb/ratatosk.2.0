/**
 * German Grammar System for Umgebung Dialog
 * Handles proper articles, cases, and confirmation text generation
 */

import type { UmgebungSubRegion, UmgebungSubSubRegion } from './umgebungDialogData'

export type Gender = 'm' | 'f' | 'n'

/**
 * Get articles for a given gender
 * Returns articles in nominative, accusative, and dative cases
 */
export function getArticles(gender?: Gender): { nom: string; acc: string; dat: string } {
  if (gender === 'm') return { nom: 'der', acc: 'den', dat: 'dem' }
  if (gender === 'f') return { nom: 'die', acc: 'die', dat: 'der' }
  if (gender === 'n') return { nom: 'das', acc: 'das', dat: 'dem' }
  return { nom: '', acc: '', dat: '' }
}

/**
 * Build confirmation text with proper German grammar
 * Format: "Bitte [accusative article] [item] [verb]"
 * Example: "Bitte den Tisch bringen"
 */
export function buildConfirmationText(
  subRegion: UmgebungSubRegion | null,
  verb: UmgebungSubSubRegion | null
): string {
  if (!subRegion || !verb) {
    return 'Auswahl erfasst'
  }

  const articles = getArticles(subRegion.gender)
  // Use accusative for direct object (direct object in German uses accusative case)
  const article = articles.acc
  
  // Clean up any extra spaces
  return `Bitte ${article} ${subRegion.title} ${verb.title}`.replace(/\s+/g, ' ')
}

