/**
 * Mapping between UI IDs (painAssessmentData.ts) and Domain IDs (PainAssessmentService)
 * This ensures consistent data storage and reporting across the system
 */

// Mapping: UI ID → Domain ID
export const uiToDomainIdMap: Record<string, string> = {
  // Kopf (Head)
  'stirn': 'forehead',
  'hinterkopf': 'back_of_head',
  'schlaefe': 'temple',
  'nacken': 'neck',
  'kiefer': 'jaw',
  'nebenhoehlen': 'sinus',
  'hals': 'throat',
  'auge': 'eye',
  'nase': 'nose',
  'mund': 'mouth',
  'speiseroehre': 'esophagus',
  
  // Beine (Legs)
  'oberschenkel': 'thigh',
  'knie': 'knee',
  'unterschenkel': 'lower_leg',
  'knoechel': 'ankle',
  'fuss': 'ball_of_foot', // Approximation
  'zehen': 'toes',
  'huefte': 'hip',
  'wade': 'lower_leg', // Approximation - no direct match
  'leiste': 'hip', // Approximation
  'gesaess': 'hip', // Approximation - no direct match in domain
  'sprunggelenk': 'ankle', // Approximation
  
  // Arme (Arms)
  'oberarm': 'upper_arm',
  'unterarm': 'forearm',
  'ellenbogen': 'elbow',
  'handgelenk': 'wrist',
  'hand': 'hand',
  'finger': 'fingers',
  'schulter': 'shoulder_arm',
  'daumen': 'fingers', // Approximation
  'achsel': 'armpit',
  'handruecken': 'hand', // Approximation
  'handflaeche': 'hand', // Approximation
  
  // Torso
  'brust': 'chest',
  'ruecken': 'shoulder_blade', // Approximation
  'schulterblatt': 'shoulder_blade',
  'wirbelsaeule': 'spine',
  'bauch': 'stomach',
  'lunge': 'lung',
  'herz': 'heart',
  'magen': 'stomach',
  'leber': 'stomach', // Approximation - no direct match
  'niere': 'stomach', // Approximation - no direct match
  'blase': 'bladder'
}

// Reverse mapping: Domain ID → UI ID
export const domainToUiIdMap: Record<string, string> = Object.fromEntries(
  Object.entries(uiToDomainIdMap).map(([ui, domain]) => [domain, ui])
)

/**
 * Convert UI ID to Domain ID
 */
export function uiIdToDomainId(uiId: string): string {
  return uiToDomainIdMap[uiId] || uiId
}

/**
 * Convert Domain ID to UI ID
 */
export function domainIdToUiId(domainId: string): string {
  return domainToUiIdMap[domainId] || domainId
}

/**
 * Get domain ID for a UI sub-region
 */
export function getDomainIdForSubRegion(subRegionId: string): string {
  return uiIdToDomainId(subRegionId)
}

