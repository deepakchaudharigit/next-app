/**
 * Tests for Password Validation Utility
 * Comprehensive test suite for password security requirements validation
 */

import { validatePassword, zodPasswordValidator, PasswordValidationResult } from '@lib/password-validator';

describe('Password Validator', () => {
  describe('validatePassword', () => {
    describe('Valid passwords', () => {
      const validPasswords = [
        'Password@123',
        'MySecure1!',
        'Test123#',
        'Admin2024$',
        'User@Pass1',
        'Complex9&',
        'Strong!2A',
        'Valid123*',
        'Secure#4B',
        'Example1%',
        'AbC123!@#',
        'LongPassword123!',
        'MixedCase1@',
        'Special&123A',
        'Numbers123!',
      ];

      test.each(validPasswords)('should accept valid password: %s', (password) => {
        const result = validatePassword(password);
        expect(result.success).toBe(true);
        expect(result.message).toBe('Password accepted');
      });
    });

    describe('Invalid passwords - Length requirement', () => {
      const shortPasswords = [
        'Pass1!',     // 6 chars
        'Ab1!',       // 4 chars
        'A1!',        // 3 chars
        '',           // empty
        'Abc123!',    // 7 chars
      ];

      test.each(shortPasswords)('should reject password too short: %s', (password) => {
        const result = validatePassword(password);
        expect(result.success).toBe(false);
        expect(result.message).toBe('Password must be at least 8 chars long, include uppercase, lowercase, number, and special character (example: Password@123)');
      });
    });

    describe('Invalid passwords - Missing uppercase', () => {
      const noUppercasePasswords = [
        'password123!',
        'lowercase1@',
        'nouppercase2#',
        'alllower3$',
        'test123%',
      ];

      test.each(noUppercasePasswords)('should reject password without uppercase: %s', (password) => {
        const result = validatePassword(password);
        expect(result.success).toBe(false);
        expect(result.message).toBe('Password must be at least 8 chars long, include uppercase, lowercase, number, and special character (example: Password@123)');
      });
    });

    describe('Invalid passwords - Missing lowercase', () => {
      const noLowercasePasswords = [
        'PASSWORD123!',
        'UPPERCASE1@',
        'NOLOWERCASE2#',
        'ALLUPPER3$',
        'TEST123%',
      ];

      test.each(noLowercasePasswords)('should reject password without lowercase: %s', (password) => {
        const result = validatePassword(password);
        expect(result.success).toBe(false);
        expect(result.message).toBe('Password must be at least 8 chars long, include uppercase, lowercase, number, and special character (example: Password@123)');
      });
    });

    describe('Invalid passwords - Missing numbers', () => {
      const noNumberPasswords = [
        'Password!',
        'NoNumbers@',
        'OnlyLetters#',
        'TestCase$',
        'Example%',
      ];

      test.each(noNumberPasswords)('should reject password without numbers: %s', (password) => {
        const result = validatePassword(password);
        expect(result.success).toBe(false);
        expect(result.message).toBe('Password must be at least 8 chars long, include uppercase, lowercase, number, and special character (example: Password@123)');
      });
    });

    describe('Invalid passwords - Missing special characters', () => {
      const noSpecialCharPasswords = [
        'Password123',
        'NoSpecial1',
        'OnlyAlphaNum2',
        'TestCase3',
        'Example4',
      ];

      test.each(noSpecialCharPasswords)('should reject password without special characters: %s', (password) => {
        const result = validatePassword(password);
        expect(result.success).toBe(false);
        expect(result.message).toBe('Password must be at least 8 chars long, include uppercase, lowercase, number, and special character (example: Password@123)');
      });
    });

    describe('Special character validation', () => {
      const specialChars = ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '_', '+', '-', '=', '[', ']', '{', '}', ';', "'", ':', '"', '\\', '|', ',', '.', '<', '>', '/', '?'];

      test.each(specialChars)('should accept password with special character: %s', (specialChar) => {
        const password = `Password1${specialChar}`;
        const result = validatePassword(password);
        expect(result.success).toBe(true);
        expect(result.message).toBe('Password accepted');
      });
    });

    describe('Edge cases', () => {
      it('should handle exactly 8 characters with all requirements', () => {
        const result = validatePassword('Pass123!');
        expect(result.success).toBe(true);
        expect(result.message).toBe('Password accepted');
      });

      it('should handle very long passwords', () => {
        const longPassword = 'VeryLongPassword123!WithManyCharacters';
        const result = validatePassword(longPassword);
        expect(result.success).toBe(true);
        expect(result.message).toBe('Password accepted');
      });

      it('should handle multiple special characters', () => {
        const result = validatePassword('Pass123!@#$');
        expect(result.success).toBe(true);
        expect(result.message).toBe('Password accepted');
      });

      it('should handle multiple numbers', () => {
        const result = validatePassword('Pass123456!');
        expect(result.success).toBe(true);
        expect(result.message).toBe('Password accepted');
      });

      it('should handle multiple uppercase letters', () => {
        const result = validatePassword('PASSWORD123!');
        expect(result.success).toBe(false); // Missing lowercase
      });

      it('should handle multiple lowercase letters', () => {
        const result = validatePassword('password123!');
        expect(result.success).toBe(false); // Missing uppercase
      });
    });

    describe('Real-world examples', () => {
      const realWorldExamples = [
        { password: 'pass123', expected: false, description: 'Example from requirements' },
        { password: 'Password@123', expected: true, description: 'Example from requirements' },
        { password: 'MyP@ssw0rd', expected: true, description: 'Common pattern' },
        { password: 'Secure123!', expected: true, description: 'Business password' },
        { password: 'admin123', expected: false, description: 'Weak admin password' },
        { password: 'StrongP@ss1', expected: true, description: 'Strong password' },
      ];

      test.each(realWorldExamples)('$description: $password', ({ password, expected }) => {
        const result = validatePassword(password);
        expect(result.success).toBe(expected);
        
        if (expected) {
          expect(result.message).toBe('Password accepted');
        } else {
          expect(result.message).toBe('Password must be at least 8 chars long, include uppercase, lowercase, number, and special character (example: Password@123)');
        }
      });
    });
  });

  describe('zodPasswordValidator', () => {
    it('should return true for valid passwords', () => {
      expect(zodPasswordValidator('Password@123')).toBe(true);
      expect(zodPasswordValidator('MySecure1!')).toBe(true);
      expect(zodPasswordValidator('Test123#')).toBe(true);
    });

    it('should return false for invalid passwords', () => {
      expect(zodPasswordValidator('pass123')).toBe(false);
      expect(zodPasswordValidator('PASSWORD123!')).toBe(false);
      expect(zodPasswordValidator('password123!')).toBe(false);
      expect(zodPasswordValidator('Password!')).toBe(false);
      expect(zodPasswordValidator('Password123')).toBe(false);
      expect(zodPasswordValidator('Pass1!')).toBe(false);
    });

    it('should be consistent with validatePassword function', () => {
      const testPasswords = [
        'Password@123',
        'pass123',
        'PASSWORD123!',
        'password123!',
        'Password!',
        'Password123',
        'Pass1!',
        'MySecure1!',
        'Test123#',
      ];

      testPasswords.forEach(password => {
        const validateResult = validatePassword(password);
        const zodResult = zodPasswordValidator(password);
        expect(zodResult).toBe(validateResult.success);
      });
    });
  });

  describe('Return type validation', () => {
    it('should return correct PasswordValidationResult structure for valid password', () => {
      const result: PasswordValidationResult = validatePassword('Password@123');
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('message');
      expect(typeof result.success).toBe('boolean');
      expect(typeof result.message).toBe('string');
      expect(result.success).toBe(true);
      expect(result.message).toBe('Password accepted');
    });

    it('should return correct PasswordValidationResult structure for invalid password', () => {
      const result: PasswordValidationResult = validatePassword('pass123');
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('message');
      expect(typeof result.success).toBe('boolean');
      expect(typeof result.message).toBe('string');
      expect(result.success).toBe(false);
      expect(result.message).toBe('Password must be at least 8 chars long, include uppercase, lowercase, number, and special character (example: Password@123)');
    });
  });
});