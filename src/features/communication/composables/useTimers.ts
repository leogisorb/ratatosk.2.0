/**
 * Composable für Timer-Management
 * Kapselt alle Timeout/Interval-Verwaltungen für die virtuelle Tastatur
 */
export function useTimers() {
  let currentTimer: number | null = null
  let rowScanInterval: number | null = null
  let letterScanInterval: number | null = null

  /**
   * Löscht alle aktiven Timer und setzt sie auf null
   */
  const clearAllTimers = () => {
    if (currentTimer) {
      clearTimeout(currentTimer)
      currentTimer = null
    }
    if (rowScanInterval) {
      clearInterval(rowScanInterval)
      rowScanInterval = null
    }
    if (letterScanInterval) {
      clearInterval(letterScanInterval)
      letterScanInterval = null
    }
  }

  /**
   * Setzt einen neuen Timer
   * @param callback Die auszuführende Funktion
   * @param delay Verzögerung in Millisekunden
   * @returns Timer-ID
   */
  const setTimer = (callback: () => void, delay: number): number => {
    clearAllTimers() // Alte Timer löschen
    currentTimer = window.setTimeout(callback, delay)
    return currentTimer
  }

  /**
   * Setzt ein neues Interval
   * @param callback Die auszuführende Funktion
   * @param interval Intervall in Millisekunden
   * @returns Interval-ID
   */
  const setRowScanInterval = (callback: () => void, interval: number): number => {
    rowScanInterval = window.setInterval(callback, interval)
    return rowScanInterval
  }

  /**
   * Setzt ein neues Interval für Buchstabenscanning
   * @param callback Die auszuführende Funktion
   * @param interval Intervall in Millisekunden
   * @returns Interval-ID
   */
  const setLetterScanInterval = (callback: () => void, interval: number): number => {
    letterScanInterval = window.setInterval(callback, interval)
    return letterScanInterval
  }

  return { 
    currentTimer, 
    rowScanInterval, 
    letterScanInterval, 
    clearAllTimers,
    setTimer,
    setRowScanInterval,
    setLetterScanInterval
  }
}
