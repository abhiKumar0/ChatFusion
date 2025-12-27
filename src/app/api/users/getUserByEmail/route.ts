import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { message: 'Email is required' },
        { status: 400 }
      );
    }

    // Search for user by email
    const { data: user, error } = await supabase
      .from('User')
      .select('id, email, fullName, username, avatar')
      .eq('email', email)
      .single();

    if (error || !user) {
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
