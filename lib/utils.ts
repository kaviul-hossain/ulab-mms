import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Validates email format according to a comprehensive regex pattern
 * @param email - The email address to validate
 * @returns true if email is valid, false otherwise
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }

  // Email regex pattern - matches most common email formats
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  // Additional checks
  const trimmedEmail = email.trim();
  const isValidFormat = emailRegex.test(trimmedEmail);
  const hasValidLength = trimmedEmail.length >= 5 && trimmedEmail.length <= 254;
  const hasValidLocalPart = trimmedEmail.split('@')[0].length <= 64;

  return isValidFormat && hasValidLength && hasValidLocalPart;
}
