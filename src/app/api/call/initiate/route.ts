import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import { CallService } from '@/services/CallService';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { receiverId, offerSdp, isVideo } = await request.json();

    const call = await CallService.initiateCall({
      callerId: user.id,
      receiverId,
      offerSdp,
      isVideo,
    });

    // Notify receiver via Socket.IO instead of Redis
    const io = (global as any).io;
    if (io) {
      io.to(`user:${receiverId}`).emit('call:incoming', call);
    }

    return NextResponse.json(call);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}