export const PASSWORD_PATTERNS = {
  LOWERCASE: /[a-z]/,
  UPPERCASE: /[A-Z]/,
  SPECIAL_CHAR: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/,
  MIN_LENGTH: 6,
} as const;

export const PASSWORD_MESSAGES = {
  MIN_LENGTH: 'Password must be at least 6 characters',
  LOWERCASE: 'Password must contain at least one lowercase letter',
  UPPERCASE: 'Password must contain at least one uppercase letter',
  SPECIAL_CHAR: 'Password must contain at least one special character',
} as const;
