/**
 * German Grammar System for Pain Assessment Confirmation Text
 * Handles proper articles, prepositions, and gender for body parts
 */

export interface GrammarRule {
  preposition: 'am' | 'an der' | 'im' | 'in der' | 'an den' | 'auf der'
  article: 'der' | 'die' | 'das'
  form: 'singular' | 'plural'
  useForm: 'form1' | 'form2' // form1 = "Schmerzen am X", form2 = "Xschmerzen"
}

/**
 * Grammar rules for body parts
 * Maps sub-region ID to grammar rule
 */
const grammarRules: Record<string, GrammarRule> = {
  // Kopf - masculine (der) / neuter (das)
  'stirn': { preposition: 'an der', article: 'die', form: 'singular', useForm: 'form2' }, // Stirnschmerzen
  'hinterkopf': { preposition: 'am', article: 'der', form: 'singular', useForm: 'form1' }, // Schmerzen am Hinterkopf
  'schlaefe': { preposition: 'an der', article: 'die', form: 'singular', useForm: 'form2' }, // Schläfenschmerzen
  'nacken': { preposition: 'im', article: 'der', form: 'singular', useForm: 'form1' }, // Schmerzen im Nacken
  'kiefer': { preposition: 'im', article: 'der', form: 'singular', useForm: 'form1' }, // Schmerzen im Kiefer
  'nebenhoehlen': { preposition: 'in den', article: 'die', form: 'plural', useForm: 'form1' }, // Schmerzen in den Nebenhöhlen
  'hals': { preposition: 'im', article: 'der', form: 'singular', useForm: 'form1' }, // Schmerzen im Hals
  'auge': { preposition: 'am', article: 'das', form: 'singular', useForm: 'form2' }, // Augenschmerzen
  'nase': { preposition: 'an der', article: 'die', form: 'singular', useForm: 'form2' }, // Nasenschmerzen
  'mund': { preposition: 'im', article: 'der', form: 'singular', useForm: 'form2' }, // Mundschmerzen
  'speiseroehre': { preposition: 'in der', article: 'die', form: 'singular', useForm: 'form1' }, // Schmerzen in der Speiseröhre
  
  // Beine - masculine (der) / feminine (die)
  'oberschenkel': { preposition: 'am', article: 'der', form: 'singular', useForm: 'form1' }, // Schmerzen am Oberschenkel
  'knie': { preposition: 'am', article: 'das', form: 'singular', useForm: 'form1' }, // Schmerzen am Knie
  'unterschenkel': { preposition: 'am', article: 'der', form: 'singular', useForm: 'form1' }, // Schmerzen am Unterschenkel
  'knoechel': { preposition: 'am', article: 'der', form: 'singular', useForm: 'form1' }, // Schmerzen am Knöchel
  'fuss': { preposition: 'am', article: 'der', form: 'singular', useForm: 'form2' }, // Fußschmerzen
  'zehen': { preposition: 'an den', article: 'die', form: 'plural', useForm: 'form1' }, // Schmerzen an den Zehen
  'huefte': { preposition: 'an der', article: 'die', form: 'singular', useForm: 'form1' }, // Schmerzen an der Hüfte
  'wade': { preposition: 'an der', article: 'die', form: 'singular', useForm: 'form1' }, // Schmerzen an der Wade
  'leiste': { preposition: 'in der', article: 'die', form: 'singular', useForm: 'form1' }, // Schmerzen in der Leiste
  'gesaess': { preposition: 'am', article: 'das', form: 'singular', useForm: 'form1' }, // Schmerzen am Gesäß
  'sprunggelenk': { preposition: 'am', article: 'das', form: 'singular', useForm: 'form1' }, // Schmerzen am Sprunggelenk
  
  // Arme - masculine (der) / neuter (das)
  'oberarm': { preposition: 'am', article: 'der', form: 'singular', useForm: 'form1' }, // Schmerzen am Oberarm
  'unterarm': { preposition: 'am', article: 'der', form: 'singular', useForm: 'form1' }, // Schmerzen am Unterarm
  'ellenbogen': { preposition: 'am', article: 'der', form: 'singular', useForm: 'form1' }, // Schmerzen am Ellenbogen
  'handgelenk': { preposition: 'am', article: 'das', form: 'singular', useForm: 'form1' }, // Schmerzen am Handgelenk
  'hand': { preposition: 'an der', article: 'die', form: 'singular', useForm: 'form2' }, // Handschmerzen
  'finger': { preposition: 'an den', article: 'die', form: 'plural', useForm: 'form1' }, // Schmerzen an den Fingern
  'schulter': { preposition: 'an der', article: 'die', form: 'singular', useForm: 'form1' }, // Schmerzen an der Schulter
  'daumen': { preposition: 'am', article: 'der', form: 'singular', useForm: 'form2' }, // Daumenschmerzen
  'achsel': { preposition: 'in der', article: 'die', form: 'singular', useForm: 'form1' }, // Schmerzen in der Achsel
  'handruecken': { preposition: 'am', article: 'der', form: 'singular', useForm: 'form1' }, // Schmerzen am Handrücken
  'handflaeche': { preposition: 'auf der', article: 'die', form: 'singular', useForm: 'form1' }, // Schmerzen auf der Handfläche
  
  // Torso - masculine (der) / feminine (die) / neuter (das)
  'brust': { preposition: 'in der', article: 'die', form: 'singular', useForm: 'form2' }, // Brustschmerzen
  'ruecken': { preposition: 'im', article: 'der', form: 'singular', useForm: 'form2' }, // Rückenschmerzen
  'schulterblatt': { preposition: 'am', article: 'das', form: 'singular', useForm: 'form1' }, // Schmerzen am Schulterblatt
  'wirbelsaeule': { preposition: 'an der', article: 'die', form: 'singular', useForm: 'form1' }, // Schmerzen an der Wirbelsäule
  'bauch': { preposition: 'im', article: 'der', form: 'singular', useForm: 'form2' }, // Bauchschmerzen
  'lunge': { preposition: 'in der', article: 'die', form: 'singular', useForm: 'form2' }, // Lungenschmerzen
  'herz': { preposition: 'am', article: 'das', form: 'singular', useForm: 'form2' }, // Herzschmerzen
  'magen': { preposition: 'im', article: 'der', form: 'singular', useForm: 'form2' }, // Magenschmerzen
  'leber': { preposition: 'in der', article: 'die', form: 'singular', useForm: 'form2' }, // Leberschmerzen
  'niere': { preposition: 'an der', article: 'die', form: 'singular', useForm: 'form2' }, // Nierenschmerzen
  'blase': { preposition: 'in der', article: 'die', form: 'singular', useForm: 'form2' } // Blasenschmerzen
}

/**
 * Get grammar rule for a sub-region
 */
export function getGrammarRule(subRegionId: string): GrammarRule | null {
  return grammarRules[subRegionId] || null
}

/**
 * Generate confirmation text with proper German grammar
 */
export function generatePainConfirmationText(
  subRegionId: string,
  subRegionTitle: string,
  painLevel: number,
  painDescription: string
): string {
  const rule = getGrammarRule(subRegionId)
  
  if (!rule) {
    // Fallback: Use simple form if no rule exists
    return `Der Patient hat ${subRegionTitle}schmerzen Level ${painLevel}, ${painDescription}.`
  }
  
  let painDescriptionText: string
  
  if (rule.useForm === 'form1') {
    // Form 1: "Schmerzen am/an der/im X"
    painDescriptionText = `Schmerzen ${rule.preposition} ${subRegionTitle}`
  } else {
    // Form 2: "Xschmerzen"
    painDescriptionText = `${subRegionTitle}schmerzen`
  }
  
  return `Der Patient hat ${painDescriptionText} Level ${painLevel}, ${painDescription}.`
}

