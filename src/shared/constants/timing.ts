/**
 * Central timing constants
 * Eliminates magic numbers throughout the codebase
 */

export const TIMING = {
  TTS: {
    DEFAULT_TIMEOUT: 10000,
    RETRY_DELAY: 1000,
    MAX_RETRIES: 3,
    EMPTY_TEXT_DELAY: 500
  },
  AUTO_MODE: {
    INITIAL_DELAY: 3000,
    CYCLE_DELAY: 3000,
    RETRY_DELAY: 100
  },
  INPUT: {
    BLINK_COOLDOWN: 300,
    SINGLE_EYE_COOLDOWN: 500,
    TOUCH_SWIPE_THRESHOLD: 50,
    TOUCH_DURATION_MAX: 500
  },
  DIALOG: {
    CONFIRMATION_RESET_DELAY: 3000,
    AUTO_MODE_START_DELAY: 3000,
    TRANSITION_DELAY: 300
  }
} as const

