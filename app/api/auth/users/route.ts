import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@lib/auth-utils';
import { prisma } from '@lib/prisma';
import { hashPassword } from '@lib/auth';
import { registerSchema } from '@lib/validations';
import { ZodError } from 'zod';
import { UserRole } from '@prisma/client';

// ──────────────────────────────────────────────
// GET /api/auth/users — Fetch all users (admin)
// ──────────────────────────────────────────────
export const GET = withAdminAuth(async (req: NextRequest, sessionUser) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            auditLogs: true,
            reports: true, // ✅ Valid now, since User → Report[] is defined
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Users fetched successfully',
      data: users,
    });
  } catch (error: unknown) {
    console.error('Error fetching users:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
});

// ──────────────────────────────────────────────
// POST /api/auth/users — Create a new user
// ──────────────────────────────────────────────
export const POST = withAdminAuth(async (req: NextRequest, sessionUser) => {
  try {
    const body: unknown = await req.json();
    
    const validationResult = registerSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({
        success: false,
        message: 'Invalid input data',
        errors: validationResult.error.issues,
      }, { status: 400 });
    }
    
    const { name, email, password, role } = validationResult.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json({
        success: false,
        message: 'User with this email already exists',
      }, { status: 409 });
    }

    // Hash password securely
    const hashedPassword = await hashPassword(password);

    // Create the new user
    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase(),
        password: hashedPassword,
        role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    // Log the creation in audit logs
    await prisma.auditLog.create({
      data: {
        userId: sessionUser.id,
        action: 'create',
        resource: 'user',
        details: {
          createdUserId: newUser.id,
          createdUserEmail: newUser.email,
          createdUserRole: newUser.role,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      data: newUser,
    }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return NextResponse.json({
        success: false,
        message: 'Invalid input data',
        errors: error.issues,
      }, { status: 400 });
    }
    
    console.error('Error creating user:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
    }, { status: 500 });
  }
});
