/**
 * Refactored Auth Utilities Tests
 * Focus: Business logic, not framework behavior
 * Removed: Deprecated function tests, academic edge cases
 */

jest.mock("bcryptjs", () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

import { hashPassword, verifyPassword } from "@lib/auth";
import bcrypt from "bcryptjs";

const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe("Auth utilities", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXTAUTH_SECRET = "test-secret";
  });

  describe("Password hashing", () => {
    it("should hash passwords securely", async () => {
      const password = "testpassword123";
      const hashedPassword = "hashed_password_result";

      mockBcrypt.hash.mockResolvedValue(hashedPassword as never);

      const result = await hashPassword(password);

      expect(mockBcrypt.hash).toHaveBeenCalledWith(password, 12);
      expect(result).toBe(hashedPassword);
    });

    it("should handle hashing errors", async () => {
      const password = "testpassword123";
      const error = new Error("Hashing failed");

      mockBcrypt.hash.mockRejectedValue(error as never);

      await expect(hashPassword(password)).rejects.toThrow("Hashing failed");
    });
  });

  describe("Password verification", () => {
    it("should verify correct passwords", async () => {
      const password = "testpassword123";
      const hashedPassword = "hashed_password";

      mockBcrypt.compare.mockResolvedValue(true as never);

      const result = await verifyPassword(password, hashedPassword);

      expect(mockBcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
      expect(result).toBe(true);
    });

    it("should reject incorrect passwords", async () => {
      const password = "wrongpassword";
      const hashedPassword = "hashed_password";

      mockBcrypt.compare.mockResolvedValue(false as never);

      const result = await verifyPassword(password, hashedPassword);

      expect(result).toBe(false);
    });

    it("should handle verification errors", async () => {
      const password = "testpassword123";
      const hashedPassword = "hashed_password";
      const error = new Error("Verification failed");

      mockBcrypt.compare.mockRejectedValue(error as never);

      await expect(verifyPassword(password, hashedPassword)).rejects.toThrow(
        "Verification failed",
      );
    });
  });
});