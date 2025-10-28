/**
 * Utility-Funktionen für Leuchtdauer-Management
 * 
 * Diese Funktionen ermöglichen es Views, die globale Leuchtdauer zu verwenden,
 * aber bei Bedarf eigene Werte zu überschreiben (z.B. für CSS-Animationen).
 */

import { useSettingsStore } from '../../features/settings/stores/settings'

/**
 * Holt die aktuelle Leuchtdauer für eine View
 * @param viewName - Name der View (für Debugging)
 * @param customDuration - Optionale benutzerdefinierte Dauer in Sekunden
 * @returns Leuchtdauer in Millisekunden
 */
export function getLeuchtdauer(viewName: string, customDuration?: number): number {
  const settingsStore = useSettingsStore()
  
  // Wenn eine benutzerdefinierte Dauer angegeben ist, verwende diese
  if (customDuration !== undefined) {
    console.log(`LeuchtdauerUtils: ${viewName} verwendet benutzerdefinierte Dauer: ${customDuration}s`)
    return customDuration * 1000 // Konvertiere zu Millisekunden
  }
  
  // Verwende die globale Leuchtdauer aus den Settings
  const globalLeuchtdauer = settingsStore.settings.leuchtdauer || 2
  console.log(`LeuchtdauerUtils: ${viewName} verwendet globale Leuchtdauer: ${globalLeuchtdauer}s`)
  return globalLeuchtdauer * 1000 // Konvertiere zu Millisekunden
}

/**
 * Holt die aktuelle Leuchtdauer für Auto-Modus
 * @param viewName - Name der View (für Debugging)
 * @param customDuration - Optionale benutzerdefinierte Dauer in Sekunden
 * @returns Leuchtdauer in Millisekunden
 */
export function getAutoModeLeuchtdauer(viewName: string, customDuration?: number): number {
  const settingsStore = useSettingsStore()
  
  // Wenn eine benutzerdefinierte Dauer angegeben ist, verwende diese
  if (customDuration !== undefined) {
    console.log(`LeuchtdauerUtils: ${viewName} Auto-Modus verwendet benutzerdefinierte Dauer: ${customDuration}s`)
    return customDuration * 1000
  }
  
  // Für Auto-Modus verwende die globale Leuchtdauer
  const globalLeuchtdauer = settingsStore.settings.leuchtdauer || 3
  console.log(`LeuchtdauerUtils: ${viewName} Auto-Modus verwendet globale Leuchtdauer: ${globalLeuchtdauer}s`)
  return globalLeuchtdauer * 1000
}

/**
 * Holt die aktuelle Leuchtdauer für CSS-Animationen
 * @param viewName - Name der View (für Debugging)
 * @param customDuration - Optionale benutzerdefinierte Dauer in Sekunden
 * @returns Leuchtdauer in Sekunden (für CSS)
 */
export function getCSSLeuchtdauer(viewName: string, customDuration?: number): number {
  const settingsStore = useSettingsStore()
  
  // Wenn eine benutzerdefinierte Dauer angegeben ist, verwende diese
  if (customDuration !== undefined) {
    console.log(`LeuchtdauerUtils: ${viewName} CSS verwendet benutzerdefinierte Dauer: ${customDuration}s`)
    return customDuration
  }
  
  // Für CSS verwende die globale Leuchtdauer direkt in Sekunden
  const globalLeuchtdauer = settingsStore.settings.leuchtdauer || 3
  console.log(`LeuchtdauerUtils: ${viewName} CSS verwendet globale Leuchtdauer: ${globalLeuchtdauer}s`)
  return globalLeuchtdauer
}

/**
 * Erstellt eine CSS-Transition mit der aktuellen Leuchtdauer
 * @param viewName - Name der View (für Debugging)
 * @param properties - CSS-Eigenschaften für die Transition
 * @param customDuration - Optionale benutzerdefinierte Dauer in Sekunden
 * @returns CSS-Transition-String
 */
export function createTransition(viewName: string, properties: string[], customDuration?: number): string {
  const duration = getCSSLeuchtdauer(viewName, customDuration)
  const transitionString = properties.map(prop => `${prop} ${duration}s ease-in-out`).join(', ')
  console.log(`LeuchtdauerUtils: ${viewName} erstellt Transition: ${transitionString}`)
  return transitionString
}

/**
 * Erstellt eine CSS-Animation mit der aktuellen Leuchtdauer
 * @param viewName - Name der View (für Debugging)
 * @param animationName - Name der CSS-Animation
 * @param customDuration - Optionale benutzerdefinierte Dauer in Sekunden
 * @returns CSS-Animation-String
 */
export function createAnimation(viewName: string, animationName: string, customDuration?: number): string {
  const duration = getCSSLeuchtdauer(viewName, customDuration)
  const animationString = `${animationName} ${duration}s ease-in-out`
  console.log(`LeuchtdauerUtils: ${viewName} erstellt Animation: ${animationString}`)
  return animationString
}
