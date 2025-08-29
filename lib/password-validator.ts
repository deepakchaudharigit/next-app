/**
 * Password Validation Utility
 * Provides secure password validation for user registration with comprehensive security requirements.
 */

export interface PasswordValidationResult {
  success: boolean;
  message: string;
}

/**
 * Validates password against security requirements:
 * - Must be at least 8 characters long
 * - Must contain at least one uppercase letter (A–Z)
 * - Must contain at least one lowercase letter (a–z)
 * - Must contain at least one number (0–9)
 * - Must contain at least one special character (e.g., !@#$%^&*)
 */
export function validatePassword(password: string): PasswordValidationResult {
  // Check minimum length
  if (password.length < 8) {
    return {
      success: false,
      message: "Password must be at least 8 chars long, include uppercase, lowercase, number, and special character (example: Password@123)"
    };
  }

  // Check for uppercase letter
  if (!/[A-Z]/.test(password)) {
    return {
      success: false,
      message: "Password must be at least 8 chars long, include uppercase, lowercase, number, and special character (example: Password@123)"
    };
  }

  // Check for lowercase letter
  if (!/[a-z]/.test(password)) {
    return {
      success: false,
      message: "Password must be at least 8 chars long, include uppercase, lowercase, number, and special character (example: Password@123)"
    };
  }

  // Check for number
  if (!/[0-9]/.test(password)) {
    return {
      success: false,
      message: "Password must be at least 8 chars long, include uppercase, lowercase, number, and special character (example: Password@123)"
    };
  }

  // Check for special character
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    return {
      success: false,
      message: "Password must be at least 8 chars long, include uppercase, lowercase, number, and special character (example: Password@123)"
    };
  }

  return {
    success: true,
    message: "Password accepted"
  };
}

/**
 * Zod custom validation function for password requirements
 */
export function zodPasswordValidator(password: string): boolean {
  const result = validatePassword(password);
  return result.success;
}