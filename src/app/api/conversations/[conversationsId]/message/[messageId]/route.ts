import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import { MessageService } from '@/services/MessageService';
import { rateLimit } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

export const POST = async (
  req: Request,
  { params }: { params: Promise<{ conversationsId: string }> }
) => {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { success } = await rateLimit(user.id);
    if (!success) return NextResponse.json({ error: 'Too many messages' }, { status: 429 });

    const { conversationsId } = await params;
    const { content, media, nonce, type, parentId } = await req.json();

    const message = await MessageService.sendMessage({
      conversationId: conversationsId,
      senderId: user.id,
      content,
      media,
      nonce,
      type,
      parentId,
    });

    // Emit via Socket.IO
    const io = (global as any).io;
    if (io) {
      io.to(`conversation:${conversationsId}`).emit('message:new', message);
    }

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
};

export const GET = async (
  req: Request,
  { params }: { params: Promise<{ conversationsId: string }> }
) => {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { conversationsId } = await params;
    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get('cursor') ?? undefined;

    const result = await MessageService.getMessages({
      conversationId: conversationsId,
      cursor,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
};