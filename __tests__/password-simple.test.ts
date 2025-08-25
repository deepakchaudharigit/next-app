// Simple test for password validation
import { validatePassword } from '../lib/password-validator';

describe('Password Validation Simple Test', () => {
  it('should accept valid password', () => {
    const result = validatePassword('Password@123');
    expect(result.success).toBe(true);
    expect(result.message).toBe('Password accepted');
  });

  it('should reject invalid password', () => {
    const result = validatePassword('pass123');
    expect(result.success).toBe(false);
    expect(result.message).toBe('Password must be at least 8 chars long, include uppercase, lowercase, number, and special character (example: Password@123)');
  });
});