import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@lib/auth-utils';
import { prisma } from '@lib/prisma';
import { z } from 'zod';

// GET /api/auth/profile
export const GET = withAuth(async (req: NextRequest, user) => {
  try {
    const profile = await prisma.user.findUnique({
      where: { id: user.id },
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
            reports: true,
          },
        },
      },
    });

    if (!profile) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: profile });
  } catch (error: unknown) {
    console.error('Profile fetch error:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
});

// PATCH /api/auth/profile
const updateProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').min(2, 'Name must be at least 2 characters').trim(),
});

export const PATCH = withAuth(async (req: NextRequest, user) => {
  try {
    const body: unknown = await req.json();
    
    const validationResult = updateProfileSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({
        success: false,
        message: 'Invalid input data',
        errors: validationResult.error.issues,
      }, { status: 400 });
    }
    
    const { name } = validationResult.data;

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { name },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser,
    });
  } catch (error: unknown) {
    console.error('Profile update error:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
});

// DELETE /api/auth/profile
export const DELETE = withAuth(async (req: NextRequest, user) => {
  try {
    // Soft delete the user
    await prisma.user.update({
      where: { id: user.id },
      data: { isDeleted: true }, 
    });

    // Log the deletion
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'delete',
        resource: 'user',
        details: { selfDeleted: true },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Your account has been deactivated',
    });
  } catch (error: unknown) {
    console.error('Soft delete error:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
});
