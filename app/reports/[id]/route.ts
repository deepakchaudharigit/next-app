import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@lib/auth-utils';
import { prisma } from '@lib/prisma';

// GET /api/reports/:id
export const GET = withAuth(async (req, user, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;
    const report = await prisma.report.findUnique({
      where: { id },
    });

    if (!report || report.userId !== user.id) {
      return NextResponse.json({ success: false, message: 'Report not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: report });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Error fetching report' }, { status: 500 });
  }
});

// PUT /api/reports/:id
export const PUT = withAuth(async (req, user, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;
    const body = await req.json();
    const { title, content } = body;

    const existing = await prisma.report.findUnique({ where: { id } });

    if (!existing || existing.userId !== user.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized or not found' }, { status: 403 });
    }

    const updated = await prisma.report.update({
      where: { id },
      data: {
        title: title || existing.title,
        content: content ?? existing.content,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Error updating report' }, { status: 500 });
  }
});

// DELETE /api/reports/:id
export const DELETE = withAuth(async (req, user, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;
    const existing = await prisma.report.findUnique({ where: { id } });

    if (!existing || existing.userId !== user.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized or not found' }, { status: 403 });
    }

    await prisma.report.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Report deleted' });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Error deleting report' }, { status: 500 });
  }
});
