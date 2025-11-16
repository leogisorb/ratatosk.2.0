/**
 * Shared BodyPart Definition
 * Centralized definition to avoid duplication
 */

export type BodyPartId = 
  | 'forehead' | 'back_of_head' | 'temple' | 'ear' | 'eye' | 'sinus'
  | 'nose' | 'mouth' | 'jaw' | 'neck' | 'throat' | 'esophagus'
  | 'heart' | 'chest' | 'shoulder' | 'lung' | 'stomach' | 'bladder' | 'hip'
  | 'shoulder_blade' | 'spine' | 'toes' | 'ball_of_foot' | 'top_of_foot'
  | 'ankle' | 'lower_leg' | 'knee' | 'thigh' | 'genital_organ'
  | 'fingers' | 'hand' | 'wrist' | 'forearm' | 'elbow' | 'upper_arm'

export type PainCategory = 'head' | 'torso' | 'arms' | 'legs' | 'general'

export interface BodyPartInfo {
  id: BodyPartId
  name: string
  category: PainCategory
  subCategory?: string
  icon?: string
  description?: string
}

/**
 * BodyPart metadata mapping
 */
export const BODY_PARTS: Record<BodyPartId, Omit<BodyPartInfo, 'id'>> = {
  // Head
  forehead: { name: 'Stirn', category: 'head' },
  back_of_head: { name: 'Hinterkopf', category: 'head' },
  temple: { name: 'Schläfe', category: 'head' },
  ear: { name: 'Ohr', category: 'head' },
  eye: { name: 'Auge', category: 'head' },
  sinus: { name: 'Nebenhöhlen', category: 'head' },
  nose: { name: 'Nase', category: 'head' },
  mouth: { name: 'Mund', category: 'head' },
  jaw: { name: 'Kiefer', category: 'head' },
  neck: { name: 'Nacken', category: 'head' },
  throat: { name: 'Hals', category: 'head' },
  esophagus: { name: 'Speiseröhre', category: 'head' },
  
  // Torso
  heart: { name: 'Herz', category: 'torso' },
  chest: { name: 'Brust', category: 'torso' },
  shoulder: { name: 'Schulter', category: 'torso' },
  lung: { name: 'Lunge', category: 'torso' },
  stomach: { name: 'Magen', category: 'torso' },
  bladder: { name: 'Blase', category: 'torso' },
  hip: { name: 'Hüfte', category: 'torso' },
  shoulder_blade: { name: 'Schulterblatt', category: 'torso' },
  spine: { name: 'Wirbelsäule', category: 'torso' },
  
  // Arms
  fingers: { name: 'Finger', category: 'arms' },
  hand: { name: 'Hand', category: 'arms' },
  wrist: { name: 'Handgelenk', category: 'arms' },
  forearm: { name: 'Unterarm', category: 'arms' },
  elbow: { name: 'Ellbogen', category: 'arms' },
  upper_arm: { name: 'Oberarm', category: 'arms' },
  
  // Legs
  toes: { name: 'Zehen', category: 'legs' },
  ball_of_foot: { name: 'Fußballen', category: 'legs' },
  top_of_foot: { name: 'Fußrücken', category: 'legs' },
  ankle: { name: 'Knöchel', category: 'legs' },
  lower_leg: { name: 'Unterschenkel', category: 'legs' },
  knee: { name: 'Knie', category: 'legs' },
  thigh: { name: 'Oberschenkel', category: 'legs' },
  genital_organ: { name: 'Geschlechtsorgan', category: 'legs' },
}

/**
 * Get body part info by ID
 */
export function getBodyPartInfo(id: BodyPartId): BodyPartInfo {
  const info = BODY_PARTS[id]
  if (!info) {
    throw new Error(`Unknown body part: ${id}`)
  }
  return { id, ...info }
}

/**
 * Get all body parts for a category
 */
export function getBodyPartsByCategory(category: PainCategory): BodyPartInfo[] {
  return Object.entries(BODY_PARTS)
    .filter(([_, info]) => info.category === category)
    .map(([id, info]) => ({ id: id as BodyPartId, ...info }))
}

