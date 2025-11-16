/**
 * Umgebung Dialog Data - Index File
 * 
 * This file serves as the main export point for all Umgebung dialog data.
 * It re-exports types and data from the organized modules:
 * - regions.ts - Main regions
 * - items.ts - Sub-regions (items)
 * - verbs.ts - Sub-sub-regions (verbs/actions)
 * - umgebungGrammar.ts - Grammar utilities
 */

// Export types and interfaces
export type { UmgebungRegion } from './regions'
export type { UmgebungSubRegion } from './items'
export type { UmgebungSubSubRegion } from './verbs'
export type { Gender } from './environmentGrammar'

// Export constants
export {
  ID_BACK,
  ID_BETT,
  ID_ZIMMER,
  ID_GEGENSTAENDE,
  mainRegions
} from './regions'

// Export sub-regions (items)
export {
  bettSubRegions,
  zimmerSubRegions,
  gegenstaendeSubRegions,
  getSubRegionsByMainRegion
} from './items'

// Export verbs (sub-sub-regions)
export {
  getSubSubRegionsBySubRegion
} from './verbs'

// Export grammar utilities
export {
  getArticles,
  buildConfirmationText
} from './environmentGrammar'
