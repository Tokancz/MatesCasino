import { CURRENCY } from '@/config/game'

const integer = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })

/** 1250000 → "1,250,000 ¢" */
export const formatMoney = (value: number): string => `${integer.format(value)} ${CURRENCY}`
