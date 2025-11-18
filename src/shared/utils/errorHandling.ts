/**
 * Shared Error Handling Utilities
 * Provides consistent error handling across the application
 */

export class CancellationError extends Error {
  constructor(message = 'Operation cancelled') {
    super(message)
    this.name = 'CancellationError'
  }
}

export class AbortError extends Error {
  constructor(message = 'Operation aborted') {
    super(message)
    this.name = 'AbortError'
  }
}

/**
 * Checks if an error is an abort/cancellation error
 */
export function isAbortError(error: unknown): boolean {
  return (
    error instanceof Error && 
    (error.message === 'Aborted' || 
     error.message === 'TTS cancelled' ||
     error.message === 'Operation cancelled' ||
     error.name === 'AbortError' ||
     error.name === 'CancellationError')
  )
}

/**
 * Checks if an error is a cancellation error
 */
export function isCancellationError(error: unknown): boolean {
  return error instanceof CancellationError || isAbortError(error)
}

/**
 * Handles errors with consistent logging and optional rethrow
 */
export function handleError(
  context: string,
  error: unknown,
  options: {
    rethrow?: boolean
    logLevel?: 'error' | 'warn' | 'info'
  } = {}
): void {
  const { rethrow = false, logLevel = 'error' } = options
  
  if (isCancellationError(error)) {
    console.info(`${context}: Operation cancelled`)
    return
  }
  
  const logFn = console[logLevel] as typeof console.error
  logFn(`${context}: Error:`, error)
  
  if (rethrow) throw error
}

