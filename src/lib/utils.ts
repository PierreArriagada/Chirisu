import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formatea números grandes con abreviaciones (K, M, B)
 * Ejemplos:
 * - 500 => "500"
 * - 1000 => "1K"
 * - 1500 => "1.5K"
 * - 10000 => "10K"
 * - 1000000 => "1M"
 * - 1500000 => "1.5M"
 * - 1000000000 => "1B"
 */
export function formatNumber(num: number): string {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toString();
}
