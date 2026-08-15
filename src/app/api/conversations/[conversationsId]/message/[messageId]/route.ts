import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import { MessageService } from '@/services/MessageService';

export const dynamic = 'force-dynamic';

export const PATCH = async (
  req: Request,
  { params }: { params: Promise<{ conversationsId: string; messageId: string }> }
) => {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { conversationsId, messageId } = await params;
    const { content, nonce } = await req.json();

    if (!content || !nonce) {
      return NextResponse.json({ error: 'Content and nonce are required' }, { status: 400 });
    }

    // Update the message in the database
    const updatedMessage = await MessageService.updateMessage({
      messageId,
      senderId: user.id,
      content,
      nonce,
    });

    // Broadcast the update in real-time via WebSockets
    const io = (global as any).io;
    if (io) {
      io.to(`conversation:${conversationsId}`).emit('message:update', updatedMessage);
    }

    return NextResponse.json(updatedMessage, { status: 200 });
  } catch (error: any) {
    console.error('Error updating message:', error);
    return NextResponse.json({ error: error.message || 'Failed to update message' }, { status: 500 });
  }
};