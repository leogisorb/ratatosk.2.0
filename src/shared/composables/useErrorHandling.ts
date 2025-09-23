import { ref, computed } from 'vue'

/**
 * Error Handling Composable
 * Provides centralized error handling functionality
 */
export function useErrorHandling() {
  const errors = ref<Map<string, string>>(new Map())
  const isLoading = ref(false)

  const hasErrors = computed(() => errors.value.size > 0)
  const errorList = computed(() => Array.from(errors.value.entries()))

  function setError(key: string, message: string) {
    errors.value.set(key, message)
  }

  function clearError(key: string) {
    errors.value.delete(key)
  }

  function clearAllErrors() {
    errors.value.clear()
  }

  function getError(key: string): string | undefined {
    return errors.value.get(key)
  }

  function hasError(key: string): boolean {
    return errors.value.has(key)
  }

  async function withErrorHandling<T>(
    operation: () => Promise<T>,
    errorKey: string = 'general'
  ): Promise<T | null> {
    try {
      isLoading.value = true
      clearError(errorKey)
      
      const result = await operation()
      return result
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred'
      setError(errorKey, message)
      return null
    } finally {
      isLoading.value = false
    }
  }

  function createErrorHandler(errorKey: string = 'general') {
    return (error: unknown) => {
      const message = error instanceof Error ? error.message : 'An unknown error occurred'
      setError(errorKey, message)
    }
  }

  return {
    // State
    errors: readonly(errors),
    isLoading: readonly(isLoading),
    
    // Computed
    hasErrors,
    errorList,
    
    // Actions
    setError,
    clearError,
    clearAllErrors,
    getError,
    hasError,
    withErrorHandling,
    createErrorHandler
  }
}
