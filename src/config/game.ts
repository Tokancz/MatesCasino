import type { ChipCounts, Denomination } from '@/game/chips'

export const CURRENCY = '¢'

/** Bankroll a new player starts with. */
export const STARTING_CASH = 750_000
export const STARTING_CHIPS: ChipCounts = { 1000: 20, 5000: 10, 25000: 4, 100000: 1 }

/**
 * Extra house advantage on top of the natural 2.7 % single-zero edge.
 * Probability that a spin that would pay the player a profit is redrawn
 * from the numbers where the house breaks even or wins. 0 = fair wheel.
 */
export const HOUSE_BIAS = 0.2

/** HUD chip colours, matched to the chip models (body colour, light edge inserts). */
export const CHIP_STYLES: Record<Denomination, { label: string; color: string; accent: string }> = {
  1000: { label: '1K', color: '#1f5a2c', accent: '#e4e4e4' },
  5000: { label: '5K', color: '#7a1c18', accent: '#e4e4e4' },
  25000: { label: '25K', color: '#1b2a66', accent: '#e4e4e4' },
  100000: { label: '100K', color: '#161616', accent: '#e4e4e4' },
}

export const STORAGE_KEY = 'mates-casino:wallet:v1'
