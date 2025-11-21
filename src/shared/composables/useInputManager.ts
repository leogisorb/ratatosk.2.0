/**
 * Vue Composable für InputManager
 * 
 * Wrapper um InputManager für einfache Verwendung in Vue Components
 * 
 * Beispiel:
 * ```ts
 * const { start, stop, isActive } = useInputManager({
 *   onSelect: (event) => {
 *     if (event.type === 'blink') {
 *       handleBlink()
 *     }
 *   }
 * })
 * ```
 */

import { ref, computed, readonly, onUnmounted } from 'vue'
import { InputManager, type InputType, type InputEvent, type InputManagerConfig } from '../../core/application/InputManager'

export function useInputManager(config: InputManagerConfig) {
  const manager = new InputManager(config)
  const isActive = ref(false)

  function start() {
    manager.start()
    isActive.value = true
  }

  function stop() {
    manager.stop()
    isActive.value = false
  }

  function enableInput(type: InputType, enable: boolean) {
    manager.enableInput(type, enable)
  }

  function getStatus() {
    return manager.getStatus()
  }

  // Reaktive Status
  const status = computed(() => manager.getStatus())
  const enabledInputs = computed(() => manager.getStatus().enabledInputs)

  // Auto-cleanup beim Unmount
  onUnmounted(() => {
    stop()
  })

  return {
    start,
    stop,
    enableInput,
    getStatus,
    isActive,
    // Reaktive Status
    status,
    enabledInputs,
    // Manager für erweiterte Anwendungsfälle (nur lesend)
    manager: readonly(manager) as Readonly<InputManager>
  }
}

