import {
  loginSchema,
  registerSchema,
  updateUserSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from "@lib/validations";
import { UserRole } from "@prisma/client";
import { testFormValidation } from "../utils/test-helpers.utils";

describe("Validation Schemas", () => {
  describe("loginSchema", () => {
    const validData = {
      email: "test@example.com",
      password: "Password@123", // Updated to meet 8-character secure requirements
    };

    const invalidCases = [
      {
        data: { email: "", password: "Password@123" },
        expectedErrors: ["Invalid email address"],
      },
      {
        data: { email: "invalid-email", password: "Password@123" },
        expectedErrors: ["Invalid email address"],
      },
      {
        data: { email: "abc@example.com", password: "Password@123" },
        expectedErrors: ["Email username must contain at least 4 characters before @"],
      },
      {
        data: { email: "a@example.com", password: "Password@123" },
        expectedErrors: ["Email username must contain at least 4 characters before @"],
      },
      {
        data: { email: "test@example.com", password: "" },
        expectedErrors: ["Password is required"],
      },
      {
        data: { email: "test@example.com", password: "12345" },
        expectedErrors: ["Password must be at least 8 chars long, include uppercase, lowercase, number, and special character (example: Password@123)"],
      },
    ];

    testFormValidation(loginSchema, validData, invalidCases);
  });

  describe("registerSchema", () => {
    const validData = {
      name: "John Doe",
      email: "john@example.com",
      password: "Password@123", // Updated to meet new requirements
      role: UserRole.VIEWER,
    };

    const invalidCases = [
      {
        data: { ...validData, name: "J" },
        expectedErrors: ["Name must be at least 2 characters"],
      },
      {
        data: { ...validData, email: "invalid-email" },
        expectedErrors: ["Invalid email address"],
      },
      {
        data: { ...validData, email: "abc@example.com" },
        expectedErrors: ["Email username must contain at least 4 characters before @"],
      },
      {
        data: { ...validData, email: "xy@example.com" },
        expectedErrors: ["Email username must contain at least 4 characters before @"],
      },
      {
        data: { ...validData, password: "12345" },
        expectedErrors: ["Password must be at least 8 chars long, include uppercase, lowercase, number, and special character (example: Password@123)"],
      },
      {
        data: { ...validData, password: "password123" },
        expectedErrors: ["Password must be at least 8 chars long, include uppercase, lowercase, number, and special character (example: Password@123)"],
      },
      {
        data: { ...validData, password: "PASSWORD123!" },
        expectedErrors: ["Password must be at least 8 chars long, include uppercase, lowercase, number, and special character (example: Password@123)"],
      },
      {
        data: { ...validData, password: "Password!" },
        expectedErrors: ["Password must be at least 8 chars long, include uppercase, lowercase, number, and special character (example: Password@123)"],
      },
      {
        data: { ...validData, password: "Password123" },
        expectedErrors: ["Password must be at least 8 chars long, include uppercase, lowercase, number, and special character (example: Password@123)"],
      },
    ];

    testFormValidation(registerSchema, validData, invalidCases);

    it("should allow registration without role (defaults to VIEWER)", () => {
      const dataWithoutRole = {
        name: "John Doe",
        email: "john@example.com",
        password: "Password@123", // Updated to meet new requirements
      };
      const result = registerSchema.safeParse(dataWithoutRole);
      expect(result.success).toBe(true);
    });
  });

  describe("forgotPasswordSchema", () => {
    const validData = {
      email: "test@example.com",
    };

    const invalidCases = [
      {
        data: { email: "" },
        expectedErrors: ["Invalid email address"],
      },
      {
        data: { email: "invalid-email" },
        expectedErrors: ["Invalid email address"],
      },
      {
        data: { email: "abc@example.com" },
        expectedErrors: ["Email username must contain at least 4 characters before @"],
      },
      {
        data: { email: "x@example.com" },
        expectedErrors: ["Email username must contain at least 4 characters before @"],
      },
    ];

    testFormValidation(forgotPasswordSchema, validData, invalidCases);
  });

  describe("updateUserSchema", () => {
    const validData = {
      name: "John Doe",
      email: "john@example.com",
      role: "ADMIN" as const,
    };

    const invalidCases = [
      {
        data: { email: "invalid-email" },
        expectedErrors: ["Invalid email address"],
      },
      {
        data: { email: "abc@example.com" },
        expectedErrors: ["Email username must contain at least 4 characters before @"],
      },
      {
        data: { email: "xy@example.com" },
        expectedErrors: ["Email username must contain at least 4 characters before @"],
      },
      {
        data: { name: "J" },
        expectedErrors: ["Name must be at least 2 characters"],
      },
    ];

    testFormValidation(updateUserSchema, validData, invalidCases);

    it("should allow partial updates", () => {
      const partialData = { name: "Jane Doe" };
      const result = updateUserSchema.safeParse(partialData);
      expect(result.success).toBe(true);
    });

    it("should allow valid email with 4+ characters before @", () => {
      const validEmailData = { email: "abcd@example.com" };
      const result = updateUserSchema.safeParse(validEmailData);
      expect(result.success).toBe(true);
    });
  });

  describe("Email username validation", () => {
    it("should accept emails with exactly 4 characters before @", () => {
      const testCases = [
        { email: "abcd@gmail.com", password: "Password@123" },
        { email: "test@example.com", password: "Password@123" },
        { email: "user@domain.org", password: "Password@123" },
        { email: "admin@company.co", password: "Password@123" },
      ];

      testCases.forEach(testCase => {
        const result = loginSchema.safeParse(testCase);
        expect(result.success).toBe(true);
      });
    });

    it("should reject emails with fewer than 4 characters before @", () => {
      const testCases = [
        { email: "abc@gmail.com", password: "Password@123" },
        { email: "ab@example.com", password: "Password@123" },
        { email: "a@domain.org", password: "Password@123" },
        { email: "x@company.co", password: "Password@123" },
      ];

      testCases.forEach(testCase => {
        const result = loginSchema.safeParse(testCase);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues.some(issue => 
            issue.message === "Email username must contain at least 4 characters before @"
          )).toBe(true);
        }
      });
    });

    it("should accept emails with more than 4 characters before @", () => {
      const testCases = [
        { email: "abcde@gmail.com", password: "Password@123" },
        { email: "testuser@example.com", password: "Password@123" },
        { email: "administrator@domain.org", password: "Password@123" },
      ];

      testCases.forEach(testCase => {
        const result = loginSchema.safeParse(testCase);
        expect(result.success).toBe(true);
      });
    });
  });
});
