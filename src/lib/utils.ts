import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

const cache = new Map();

export function cn(...inputs: ClassValue[]) {
  const key = JSON.stringify(inputs);
  if (cache.has(key)) {
    return cache.get(key);
  }
  const result = twMerge(clsx(inputs));
  cache.set(key, result);
  return result;
} 