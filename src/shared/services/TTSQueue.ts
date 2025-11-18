/**
 * TTS Queue with Cancellation Token Support
 * Prevents race conditions by using AbortController for each queue item
 */

export class TTSQueue {
  private queue: string[] = []
  private processing = false
  private currentCancellation: AbortController | null = null
  private synth: SpeechSynthesis

  constructor(synth: SpeechSynthesis = window.speechSynthesis) {
    this.synth = synth
  }

  /**
   * Add text to queue and process
   */
  async speak(text: string): Promise<void> {
    // Check for duplicates
    if (this.queue.includes(text)) {
      console.log('[TTSQueue] Duplicate text skipped:', text)
      return
    }

    this.queue.push(text)
    console.log('[TTSQueue] Added to queue:', text, 'Queue length:', this.queue.length)

    if (!this.processing) {
      await this.processQueue()
    }
  }

  /**
   * Process queue with cancellation support
   */
  private async processQueue(): Promise<void> {
    if (this.processing) return

    this.processing = true

    while (this.queue.length > 0) {
      // New cancellation for each item
      this.currentCancellation = new AbortController()
      const signal = this.currentCancellation.signal

      const text = this.queue.shift()!

      try {
        // Check cancellation before each step
        if (signal.aborted) break

        await this.performSpeak(text, signal)

        if (signal.aborted) break

        // Small delay between items
        await this.delay(500, signal)

      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          console.log('[TTSQueue] TTS aborted')
          break
        }
        console.error('[TTSQueue] TTS error:', error)
        // Continue with next item even on error
      }
    }

    this.processing = false
    this.currentCancellation = null
  }

  /**
   * Cancel all pending TTS operations
   */
  cancel(): void {
    console.log('[TTSQueue] Cancelling all TTS operations')
    
    // Stop running promise chain
    this.currentCancellation?.abort()
    
    // Clear queue
    this.queue = []
    
    // Cancel current TTS
    this.synth.cancel()
    
    this.processing = false
  }

  /**
   * Delay with cancellation support
   */
  private delay(ms: number, signal: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(resolve, ms)

      signal.addEventListener('abort', () => {
        clearTimeout(timeout)
        reject(new DOMException('Aborted', 'AbortError'))
      }, { once: true })
    })
  }

  /**
   * Perform TTS with cancellation support
   */
  private performSpeak(text: string, signal: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if already aborted
      if (signal.aborted) {
        reject(new DOMException('Aborted', 'AbortError'))
        return
      }

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'de-DE'
      utterance.rate = 0.8
      utterance.pitch = 1.0
      utterance.volume = 0.8

      // Abort listener
      const abortHandler = () => {
        this.synth.cancel()
        reject(new DOMException('Aborted', 'AbortError'))
      }
      signal.addEventListener('abort', abortHandler, { once: true })

      utterance.onend = () => {
        signal.removeEventListener('abort', abortHandler)
        resolve()
      }

      utterance.onerror = (event) => {
        signal.removeEventListener('abort', abortHandler)
        reject(new Error(`TTS error: ${event.error}`))
      }

      // Start TTS
      this.synth.speak(utterance)
    })
  }

  /**
   * Get queue length
   */
  getQueueLength(): number {
    return this.queue.length
  }

  /**
   * Check if processing
   */
  isProcessing(): boolean {
    return this.processing
  }
}

