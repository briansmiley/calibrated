// Initial delay before any animation starts (seconds)
export const INITIAL_DELAY = 0.5

// Logo animation duration (seconds)
export const LOGO_ANIMATION_DURATION = 0.75

// Number line timing constants (seconds)
export const LINE_DURATION = 0.3
export const DOT_START_DELAY = 0.5
export const DOT_COUNT = 7
export const DOT_INTERVAL = 0.15
export const DIAMOND_DELAY = 0.6
export const DIAMOND_ANIM_DURATION = 0.25

// Gap between logo finishing and number line starting
export const GAP_AFTER_LOGO = 0.5

// When does the number line start? (after logo finishes + gap)
export const NUMBER_LINE_START = INITIAL_DELAY + LOGO_ANIMATION_DURATION + GAP_AFTER_LOGO

// How long does the number line animation take (from line start to diamond done)?
export const NUMBER_LINE_DURATION =
  LINE_DURATION + DOT_START_DELAY + DOT_COUNT * DOT_INTERVAL + DIAMOND_DELAY + DIAMOND_ANIM_DURATION
