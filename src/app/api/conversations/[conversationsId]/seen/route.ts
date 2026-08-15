import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { prisma } from '@/lib/prisma';

export const POST = async (request: Request, { params }: { params: Promise<{ conversationsId: string }> }) => {
  try {
    const resolvedParams = await params;
    const conversationId = resolvedParams.conversationsId;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Mark all unread messages in this conversation as seen (except own)
    const updated = await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: user.id },
        status: { not: 'seen' },
      },
      data: { status: 'seen' },
    });

    // Notify everyone in the conversation room via Socket.IO
    if (updated.count > 0) {
      const io = (global as any).io;
      if (io) {
        io.to(`conversation:${conversationId}`).emit('message:seen', {
          userId: user.id,
          conversationId,
        });
      }
    }

    return NextResponse.json({ message: 'Messages marked as seen', count: updated.count });
  } catch (error: any) {
    console.error('[Mark Seen] Exception:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
};
