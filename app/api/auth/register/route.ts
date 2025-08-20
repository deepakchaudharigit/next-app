/**
 * User Registration API Route
 * Handles new user registration with input validation, password hashing,
 * and duplicate email checking for NPCL Dashboard.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@lib/prisma'
import { hashPassword } from '@lib/auth'
import { registerSchema } from '@lib/validations'
import { UserRole } from '@prisma/client'

export async function POST(req: NextRequest) {
  try {
    const body: unknown = await req.json()

    // Validate input data against schema
    const parsed = registerSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid input data',
          errors: parsed.error.issues,
        },
        { status: 400 }
      )
    }

    const {
      name,
      email,
      password,
      role,
    } = parsed.data as {
      name: string
      email: string
      password: string
      role?: string
    }

    // Resolve role safely to Prisma enum, default to VIEWER
    const resolvedRole: UserRole = Object.values(UserRole).includes(role as UserRole)
      ? (role as UserRole)
      : UserRole.VIEWER

    // Check for existing user with same email
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    })

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Hash password for secure storage
    const hashedPassword = await hashPassword(password)

    // Create new user in database
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: resolvedRole,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      data: user,
    })
  } catch (error: unknown) {
    // Narrow the error for safer logging
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Registration error:', message)

    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
