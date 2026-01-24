/**
 * Centralized AYN-branded error messages library
 * All user-facing error messages should use these codes to ensure consistent branding
 */

// Error codes organized by category
export const ErrorCodes = {
  // Authentication Errors
  AUTH_SESSION_EXPIRED: 'AUTH_SESSION_EXPIRED',
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_EMAIL_NOT_VERIFIED: 'AUTH_EMAIL_NOT_VERIFIED',
  AUTH_ACCOUNT_LOCKED: 'AUTH_ACCOUNT_LOCKED',
  AUTH_EMAIL_EXISTS: 'AUTH_EMAIL_EXISTS',
  AUTH_WEAK_PASSWORD: 'AUTH_WEAK_PASSWORD',
  AUTH_GENERIC: 'AUTH_GENERIC',
  AUTH_REGISTRATION_FAILED: 'AUTH_REGISTRATION_FAILED',
  
  // Network & Connection Errors
  NETWORK_OFFLINE: 'NETWORK_OFFLINE',
  NETWORK_CONNECTION_LOST: 'NETWORK_CONNECTION_LOST',
  NETWORK_TIMEOUT: 'NETWORK_TIMEOUT',
  
  // Rate Limit Errors
  RATE_LIMIT_CHAT: 'RATE_LIMIT_CHAT',
  RATE_LIMIT_AUTH: 'RATE_LIMIT_AUTH',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  
  // File Upload Errors
  UPLOAD_FAILED: 'UPLOAD_FAILED',
  UPLOAD_TOO_LARGE: 'UPLOAD_TOO_LARGE',
  UPLOAD_INVALID_TYPE: 'UPLOAD_INVALID_TYPE',
  UPLOAD_FOLDERS_NOT_SUPPORTED: 'UPLOAD_FOLDERS_NOT_SUPPORTED',
  UPLOAD_MULTIPLE_FILES: 'UPLOAD_MULTIPLE_FILES',
  
  // AI & Chat Errors
  AI_UNAVAILABLE: 'AI_UNAVAILABLE',
  CHAT_LIMIT_REACHED: 'CHAT_LIMIT_REACHED',
  USAGE_VERIFICATION_FAILED: 'USAGE_VERIFICATION_FAILED',
  USAGE_LIMIT_REACHED: 'USAGE_LIMIT_REACHED',
  
  // Document Errors
  DOCUMENT_GENERATION_FAILED: 'DOCUMENT_GENERATION_FAILED',
  DOWNLOAD_FAILED: 'DOWNLOAD_FAILED',
  
  // Settings & Profile Errors
  PROFILE_UPDATE_FAILED: 'PROFILE_UPDATE_FAILED',
  PASSWORD_RESET_FAILED: 'PASSWORD_RESET_FAILED',
  SETTINGS_SAVE_FAILED: 'SETTINGS_SAVE_FAILED',
  
  // Support Errors
  TICKET_CREATION_FAILED: 'TICKET_CREATION_FAILED',
  TICKET_UPDATE_FAILED: 'TICKET_UPDATE_FAILED',
  
  // Engineering Errors
  CALCULATION_FAILED: 'CALCULATION_FAILED',
  DESIGN_SAVE_FAILED: 'DESIGN_SAVE_FAILED',
  INVALID_INPUT: 'INVALID_INPUT',
  BOUNDARY_INVALID: 'BOUNDARY_INVALID',
  EXPORT_FAILED: 'EXPORT_FAILED',
  
  // Subscription Errors
  CHECKOUT_FAILED: 'CHECKOUT_FAILED',
  PORTAL_FAILED: 'PORTAL_FAILED',
  INVALID_TIER: 'INVALID_TIER',
  
  // Session Errors
  SESSION_REVOKE_FAILED: 'SESSION_REVOKE_FAILED',
  SIGN_OUT_ALL_FAILED: 'SIGN_OUT_ALL_FAILED',
  
  // Ticket Errors
  TICKET_LOAD_FAILED: 'TICKET_LOAD_FAILED',
  TICKET_MESSAGE_FAILED: 'TICKET_MESSAGE_FAILED',
  TICKET_DELETE_FAILED: 'TICKET_DELETE_FAILED',
  
  // Generic/Fallback Errors
  GENERIC: 'GENERIC',
  COPY_FAILED: 'COPY_FAILED',
  SAVE_WARNING: 'SAVE_WARNING',
  DATA_LOAD_FAILED: 'DATA_LOAD_FAILED',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

interface ErrorMessage {
  title: string;
  description: string;
  actionLabel?: string;
}

// Error message definitions with AYN's friendly, helpful personality
const errorMessages: Record<ErrorCode, ErrorMessage> = {
  // Authentication Errors
  [ErrorCodes.AUTH_SESSION_EXPIRED]: {
    title: 'Session Ended',
    description: 'Your session has ended. Please sign in again to continue.',
    actionLabel: 'Sign In',
  },
  [ErrorCodes.AUTH_INVALID_CREDENTIALS]: {
    title: 'Invalid Credentials',
    description: "That email or password didn't match. Double-check and try again?",
  },
  [ErrorCodes.AUTH_EMAIL_NOT_VERIFIED]: {
    title: 'Verify Your Email',
    description: 'Check your inbox for a verification link. We can resend it if needed.',
    actionLabel: 'Resend',
  },
  [ErrorCodes.AUTH_ACCOUNT_LOCKED]: {
    title: 'Account Temporarily Locked',
    description: 'Too many failed attempts. Please try again in a few minutes.',
  },
  [ErrorCodes.AUTH_EMAIL_EXISTS]: {
    title: 'Email Already Registered',
    description: 'This email is already in use. Try signing in or reset your password.',
    actionLabel: 'Sign In',
  },
  [ErrorCodes.AUTH_WEAK_PASSWORD]: {
    title: 'Stronger Password Needed',
    description: 'Please choose a password with at least 8 characters, including letters and numbers.',
  },
  [ErrorCodes.AUTH_GENERIC]: {
    title: 'Authentication Error',
    description: "We couldn't sign you in right now. Please try again.",
  },
  [ErrorCodes.AUTH_REGISTRATION_FAILED]: {
    title: 'Registration Error',
    description: "We couldn't create your account. Please try again in a moment.",
  },

  // Network & Connection Errors
  [ErrorCodes.NETWORK_OFFLINE]: {
    title: "You're Offline",
    description: 'Check your internet connection and try again.',
    actionLabel: 'Retry',
  },
  [ErrorCodes.NETWORK_CONNECTION_LOST]: {
    title: 'Connection Lost',
    description: 'We lost connection to AYN. Reconnecting...',
  },
  [ErrorCodes.NETWORK_TIMEOUT]: {
    title: 'Request Timed Out',
    description: 'This is taking longer than usual. Please try again.',
    actionLabel: 'Try Again',
  },

  // Rate Limit Errors
  [ErrorCodes.RATE_LIMIT_CHAT]: {
    title: 'Slow Down!',
    description: "You're sending messages too quickly. Wait a moment and try again.",
  },
  [ErrorCodes.RATE_LIMIT_AUTH]: {
    title: 'Too Many Attempts',
    description: 'Please wait a few minutes before trying again.',
  },
  [ErrorCodes.RATE_LIMIT_EXCEEDED]: {
    title: 'Rate Limit Exceeded',
    description: "You're moving too fast! Please wait a moment.",
  },

  // File Upload Errors
  [ErrorCodes.UPLOAD_FAILED]: {
    title: 'Upload Failed',
    description: "We couldn't upload your file. Please try again.",
    actionLabel: 'Retry',
  },
  [ErrorCodes.UPLOAD_TOO_LARGE]: {
    title: 'File Too Large',
    description: 'Please choose a file smaller than 10MB.',
  },
  [ErrorCodes.UPLOAD_INVALID_TYPE]: {
    title: 'Unsupported File Type',
    description: 'We support PDF, Excel, images, and text files.',
  },
  [ErrorCodes.UPLOAD_FOLDERS_NOT_SUPPORTED]: {
    title: 'Folders Not Supported',
    description: 'Please upload individual files instead of folders.',
  },
  [ErrorCodes.UPLOAD_MULTIPLE_FILES]: {
    title: 'One File at a Time',
    description: 'Please drop only one file at a time.',
  },

  // AI & Chat Errors
  [ErrorCodes.AI_UNAVAILABLE]: {
    title: 'AYN is Resting',
    description: "I'm taking a quick break. Please try again in a moment.",
  },
  [ErrorCodes.CHAT_LIMIT_REACHED]: {
    title: 'Chat Limit Reached',
    description: 'This conversation has reached its limit. Start a new chat to continue.',
    actionLabel: 'New Chat',
  },
  [ErrorCodes.USAGE_VERIFICATION_FAILED]: {
    title: 'Usage Check Failed',
    description: "We couldn't verify your usage. Please try again.",
  },
  [ErrorCodes.USAGE_LIMIT_REACHED]: {
    title: 'Usage Limit Reached',
    description: "You've reached your monthly message limit. Check Settings for details.",
  },

  // Document Errors
  [ErrorCodes.DOCUMENT_GENERATION_FAILED]: {
    title: 'Document Creation Failed',
    description: "We couldn't create your document. Please try again.",
  },
  [ErrorCodes.DOWNLOAD_FAILED]: {
    title: 'Download Failed',
    description: "The download didn't complete. Please try again.",
    actionLabel: 'Retry',
  },

  // Settings & Profile Errors
  [ErrorCodes.PROFILE_UPDATE_FAILED]: {
    title: "Couldn't Update Profile",
    description: "Your changes weren't saved. Please try again.",
  },
  [ErrorCodes.PASSWORD_RESET_FAILED]: {
    title: 'Reset Email Failed',
    description: "We couldn't send the reset email. Please try again.",
  },
  [ErrorCodes.SETTINGS_SAVE_FAILED]: {
    title: 'Settings Not Saved',
    description: "Your changes weren't saved. Please try again.",
  },

  // Support Errors
  [ErrorCodes.TICKET_CREATION_FAILED]: {
    title: "Couldn't Create Ticket",
    description: "We couldn't submit your request. Please try again.",
  },
  [ErrorCodes.TICKET_UPDATE_FAILED]: {
    title: "Couldn't Update Ticket",
    description: "The update failed. Please try again.",
  },

  // Engineering Errors
  [ErrorCodes.CALCULATION_FAILED]: {
    title: 'Calculation Error',
    description: 'Something went wrong with the calculation. Please check your inputs.',
  },
  [ErrorCodes.DESIGN_SAVE_FAILED]: {
    title: "Couldn't Save Design",
    description: "Your design wasn't saved. Please try again.",
  },
  [ErrorCodes.INVALID_INPUT]: {
    title: 'Invalid Input',
    description: 'Please check your values and try again.',
  },
  [ErrorCodes.BOUNDARY_INVALID]: {
    title: 'Invalid Boundary',
    description: 'Please define at least 3 boundary points.',
  },
  [ErrorCodes.EXPORT_FAILED]: {
    title: 'Export Failed',
    description: "We couldn't export your data. Please try again.",
  },

  // Subscription Errors
  [ErrorCodes.CHECKOUT_FAILED]: {
    title: 'Checkout Unavailable',
    description: "We couldn't start checkout. Please try again.",
  },
  [ErrorCodes.PORTAL_FAILED]: {
    title: 'Portal Unavailable',
    description: "We couldn't open subscription management. Please try again.",
  },
  [ErrorCodes.INVALID_TIER]: {
    title: 'Invalid Tier',
    description: 'Please select a valid subscription tier.',
  },

  // Session Errors
  [ErrorCodes.SESSION_REVOKE_FAILED]: {
    title: "Couldn't Revoke Session",
    description: 'The session revocation failed. Please try again.',
  },
  [ErrorCodes.SIGN_OUT_ALL_FAILED]: {
    title: "Couldn't Sign Out All Devices",
    description: 'Please try again or contact support.',
  },

  // Ticket Errors
  [ErrorCodes.TICKET_LOAD_FAILED]: {
    title: "Couldn't Load Ticket",
    description: 'Unable to load ticket details. Please try again.',
  },
  [ErrorCodes.TICKET_MESSAGE_FAILED]: {
    title: "Couldn't Send Message",
    description: "Your message wasn't sent. Please try again.",
  },
  [ErrorCodes.TICKET_DELETE_FAILED]: {
    title: "Couldn't Delete Ticket",
    description: "The ticket wasn't deleted. Please try again.",
  },

  // Generic/Fallback Errors
  [ErrorCodes.GENERIC]: {
    title: 'Something Went Wrong',
    description: 'An unexpected error occurred. Please try again.',
    actionLabel: 'Try Again',
  },
  [ErrorCodes.COPY_FAILED]: {
    title: 'Copy Failed',
    description: "Couldn't copy to clipboard. Please try manually.",
  },
  [ErrorCodes.SAVE_WARNING]: {
    title: 'Save Warning',
    description: 'Your message may not have been saved. Refresh if issues persist.',
  },
  [ErrorCodes.DATA_LOAD_FAILED]: {
    title: "Couldn't Load Data",
    description: 'Unable to load the requested data. Please try again.',
    actionLabel: 'Retry',
  },
};

/**
 * Get a user-friendly error message by error code
 * @param code - The error code
 * @returns The error message object with title and description
 */
export const getErrorMessage = (code: ErrorCode): ErrorMessage => {
  return errorMessages[code] || errorMessages[ErrorCodes.GENERIC];
};

/**
 * Parse a technical error message and return an AYN-branded message
 * Useful for parsing API errors or exceptions
 * @param error - The error object or message
 * @returns The appropriate error code
 */
export const parseErrorToCode = (error: unknown): ErrorCode => {
  const message = (error instanceof Error ? error.message : String(error)).toLowerCase();
  
  // Authentication errors
  if (message.includes('invalid login') || message.includes('invalid credentials')) {
    return ErrorCodes.AUTH_INVALID_CREDENTIALS;
  }
  if (message.includes('email not confirmed') || message.includes('not verified')) {
    return ErrorCodes.AUTH_EMAIL_NOT_VERIFIED;
  }
  if (message.includes('already registered') || message.includes('already exists')) {
    return ErrorCodes.AUTH_EMAIL_EXISTS;
  }
  if (message.includes('password') && (message.includes('weak') || message.includes('short'))) {
    return ErrorCodes.AUTH_WEAK_PASSWORD;
  }
  if (message.includes('session') && (message.includes('expired') || message.includes('invalid'))) {
    return ErrorCodes.AUTH_SESSION_EXPIRED;
  }
  
  // Network errors
  if (message.includes('offline') || message.includes('network')) {
    return ErrorCodes.NETWORK_OFFLINE;
  }
  if (message.includes('timeout') || message.includes('timed out')) {
    return ErrorCodes.NETWORK_TIMEOUT;
  }
  
  // Rate limit errors
  if (message.includes('rate limit') || message.includes('too many')) {
    return ErrorCodes.RATE_LIMIT_EXCEEDED;
  }
  
  // Upload errors
  if (message.includes('file') && message.includes('large')) {
    return ErrorCodes.UPLOAD_TOO_LARGE;
  }
  if (message.includes('file') && (message.includes('type') || message.includes('format'))) {
    return ErrorCodes.UPLOAD_INVALID_TYPE;
  }
  
  return ErrorCodes.GENERIC;
};

/**
 * Get a friendly error message from any error
 * Combines parseErrorToCode and getErrorMessage
 * @param error - The error object or message
 * @returns The error message object
 */
export const getFriendlyError = (error: unknown): ErrorMessage => {
  const code = parseErrorToCode(error);
  return getErrorMessage(code);
};
