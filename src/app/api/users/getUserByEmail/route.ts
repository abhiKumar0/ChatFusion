import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { message: 'Email is required' },
        { status: 400 }
      );
    }

    // Search for user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
          id: true,
          email: true,
          fullName: true,
          username: true,
          avatar: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { message: 'No account found with this email address' },
        { status: 404 }
      );
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error('Search user by email error:', error);
    return NextResponse.json(
      { message: 'Failed to search for user' },
      { status: 500 }
    );
  }
}
