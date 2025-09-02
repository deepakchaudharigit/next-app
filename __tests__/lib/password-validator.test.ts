/**
 * Refactored Password Validation Tests
 * Focus: Business requirements, not exhaustive edge cases
 * Removed: Academic testing of every possible character combination
 */

import { validatePassword, zodPasswordValidator, PasswordValidationResult } from '@lib/password-validator';

describe('Password Validator', () => {
  describe('Business requirement validation', () => {
    it('accepts passwords meeting security requirements', () => {
      const validPasswords = [
        'Password@123',
        'MySecure1!',
        'Test123#',
        'Admin2024$'
      ];

      validPasswords.forEach(password => {
        const result = validatePassword(password);
        expect(result.success).toBe(true);
        expect(result.message).toBe('Password accepted');
      });
    });

    it('rejects passwords not meeting security requirements', () => {
      const invalidCases = [
        { password: 'weak', reason: 'too short and missing requirements' },
        { password: 'password123!', reason: 'no uppercase' },
        { password: 'PASSWORD123!', reason: 'no lowercase' },
        { password: 'Password!', reason: 'no numbers' },
        { password: 'Password123', reason: 'no special characters' },
        { password: 'Pass1!', reason: 'too short' }
      ];

      invalidCases.forEach(({ password, reason }) => {
        const result = validatePassword(password);
        expect(result.success).toBe(false);
        expect(result.message).toBe(
          'Password must be at least 8 chars long, include uppercase, lowercase, number, and special character (example: Password@123)'
        );
      });
    });

    it('handles common special characters correctly', () => {
      const commonSpecialChars = ['!', '@', '#', '$', '%'];
      
      commonSpecialChars.forEach(char => {
        const password = `Password1${char}`;
        const result = validatePassword(password);
        expect(result.success).toBe(true);
      });
    });

    it('handles edge cases appropriately', () => {
      // Minimum valid password
      expect(validatePassword('Pass123!').success).toBe(true);
      
      // Very long password
      expect(validatePassword('VeryLongPassword123!').success).toBe(true);
      
      // Empty password
      expect(validatePassword('').success).toBe(false);
    });
  });

  describe('Integration with Zod validator', () => {
    it('maintains consistency with main validator', () => {
      const testCases = [
        { password: 'Password@123', expected: true },
        { password: 'weak', expected: false },
        { password: 'PASSWORD123!', expected: false },
        { password: 'password123!', expected: false },
        { password: 'Password!', expected: false },
        { password: 'Password123', expected: false }
      ];

      testCases.forEach(({ password, expected }) => {
        const validateResult = validatePassword(password);
        const zodResult = zodPasswordValidator(password);
        
        expect(zodResult).toBe(validateResult.success);
        expect(zodResult).toBe(expected);
      });
    });
  });

  describe('Return type validation', () => {
    it('returns correct structure for valid passwords', () => {
      const result: PasswordValidationResult = validatePassword('Password@123');
      
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('message');
      expect(typeof result.success).toBe('boolean');
      expect(typeof result.message).toBe('string');
      expect(result.success).toBe(true);
      expect(result.message).toBe('Password accepted');
    });

    it('returns correct structure for invalid passwords', () => {
      const result: PasswordValidationResult = validatePassword('weak');
      
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('message');
      expect(typeof result.success).toBe('boolean');
      expect(typeof result.message).toBe('string');
      expect(result.success).toBe(false);
    });
  });
});