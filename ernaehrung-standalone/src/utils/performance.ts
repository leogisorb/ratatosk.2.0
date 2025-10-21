// Performance-Optimierungen für Produktion
export const performanceConfig = {
  // Debug-Logging in Produktion deaktivieren
  disableLogging: import.meta.env.PROD,
  
  // Lazy-Loading für große Assets
  enableLazyLoading: true,
  
  // Debounce-Zeiten
  debounceMs: 100,
  
  // Animation-Performance
  enableGPUAcceleration: true,
  
  // Memory-Management
  enableCleanup: true
}

// Debug-Logging optimieren
export const logger = {
  log: (...args: any[]) => {
    if (!performanceConfig.disableLogging) {
      console.log(...args)
    }
  },
  
  error: (...args: any[]) => {
    console.error(...args)
  },
  
  warn: (...args: any[]) => {
    if (!performanceConfig.disableLogging) {
      console.warn(...args)
    }
  }
}

// GPU-Performance optimieren
export const optimizeGPU = () => {
  if (performanceConfig.enableGPUAcceleration) {
    // CSS-Variablen für GPU-Optimierung setzen
    document.documentElement.style.setProperty('--gpu-optimized', 'true')
  }
}

// Memory-Cleanup
export const cleanup = () => {
  if (performanceConfig.enableCleanup) {
    // Event Listener cleanup
    const events = ['click', 'keydown', 'touchstart', 'contextmenu']
    events.forEach(event => {
      document.removeEventListener(event, () => {})
    })
    
    // Timeout cleanup
    const highestTimeoutId = setTimeout(() => {}, 0)
    for (let i = 0; i < highestTimeoutId; i++) {
      clearTimeout(i)
    }
  }
}

