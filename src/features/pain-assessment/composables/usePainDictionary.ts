/**
 * ✅ MODUL 3 — usePainDictionary()
 * 
 * Alles was Regionen, Grammatik, IDs, Texte, Mapping betrifft, ist ausgelagert.
 * 
 * Damit:
 * ✅ UI ist Layout-Logik
 * ✅ Machine ist Kontroll-Logik
 * ✅ Dictionary ist Daten & Sprache
 */

import { mainRegions, subRegionMap, getAllSubRegions } from '../data/regions'
import { painLevels } from '../data/painLevels'
import { generatePainConfirmationText } from '../data/painAssessmentGrammar'

export function usePainDictionary() {
  /**
   * Gibt die Sub-Region für eine Main-Region-ID zurück
   */
  function getSubRegions(mainRegionId: string | null) {
    if (!mainRegionId) return []
    return subRegionMap[mainRegionId] ?? []
  }

  /**
   * Findet eine Sub-Region anhand ihrer ID
   */
  function findSubRegion(subRegionId: string | null) {
    if (!subRegionId) return null
    return getAllSubRegions().find(item => item.id === subRegionId) || null
  }

  /**
   * Findet einen Pain Level anhand seines Levels
   */
  function findPainLevel(level: number | null) {
    if (level === null || level === undefined) return null
    return painLevels.find(p => p.level === level) || null
  }

  /**
   * Findet eine Main Region anhand ihrer ID
   */
  function findMainRegion(mainRegionId: string | null) {
    if (!mainRegionId) return null
    return mainRegions.find(r => r.id === mainRegionId) || null
  }

  /**
   * Generiert Bestätigungstext mit korrekter Grammatik
   */
  function generateConfirmation(subRegionId: string | null, painLevel: number | null): string {
    if (!subRegionId || painLevel === null) return 'Ihre Angabe wurde gespeichert.'
    
    const subRegion = findSubRegion(subRegionId)
    const painLevelObj = findPainLevel(painLevel)
    
    if (!subRegion || !painLevelObj) return 'Ihre Angabe wurde gespeichert.'
    
    return generatePainConfirmationText(
      subRegionId,
      subRegion.title,
      painLevel,
      painLevelObj.description
    )
  }

  /**
   * Gibt den Titel für eine Sub-Region-View zurück (mit korrekter Grammatik)
   */
  function getSubRegionViewTitle(mainRegionId: string | null): string {
    if (!mainRegionId) return 'Wählen Sie einen Bereich aus.'
    
    const region = findMainRegion(mainRegionId)
    if (!region) return 'Wählen Sie einen Bereich aus.'
    
    // ✅ Korrekte deutsche Grammatik für Singular/Plural
    const pluralRegions = ['beine', 'arme'] // Plural-Regionen
    const isPlural = pluralRegions.includes(mainRegionId)
    
    if (isPlural) {
      // Plural-Form: "an den Beinen", "an den Armen"
      const pluralForm = mainRegionId === 'beine' ? 'Beinen' : 'Armen'
      return `Wählen Sie einen Bereich an den ${pluralForm} aus.`
    } else {
      // Singular-Form: "im Kopf", "im Torso"
      return `Wählen Sie einen Bereich im ${region.title} aus.`
    }
  }

  return {
    // Daten
    mainRegions,
    painLevels,
    subRegionMap,
    
    // Helper Functions
    getSubRegions,
    findSubRegion,
    findPainLevel,
    findMainRegion,
    generateConfirmation,
    getSubRegionViewTitle,
  }
}

