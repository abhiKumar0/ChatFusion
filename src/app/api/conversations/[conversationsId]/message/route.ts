import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import { MessageService } from "@/services/MessageService";
import { rateLimit } from "@/lib/rateLimit";

export const dynamic = 'force-dynamic'; 

export const POST = async (req: Request, { params }: { params: Promise<{ conversationsId: string }> }) => {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { success } = await rateLimit(user.id);
        if (!success) {
            return NextResponse.json({ error: "Too many messages. Slow down." }, {
                status: 429,
                headers: { 'X-RateLimit-Remaining' : '0' }
            });
        } 

        const resolvedParams = await params;
        const convoId = resolvedParams.conversationsId;
        const { parentId, content, media, nonce, type } = await req.json();

        if (!(content || media)) {
            return NextResponse.json({ message: "Message content cannot be empty" }, { status: 400 });
        }

        const hasContent = content && content.trim() !== '';
        const messageType = type || (media && !hasContent ? 'IMAGE' : 'TEXT');

        const newMessage = await MessageService.sendMessage({
            conversationId: convoId,
            senderId: user.id,
            content: content || '',
            media,
            nonce,
            type: messageType,
            parentId,
        });

        // Emit message to connected clients in real-time
        const io = (global as any).io;
        if (io) {
            io.to(`conversation:${convoId}`).emit('message:new', newMessage);
        }

        return NextResponse.json(newMessage, { status: 201 });
    } catch (error: any) {
        console.error("Error in message creation route:", error);
        return NextResponse.json({ message: "Error while sending a message", error: error.message || error }, { status: 500 });
    }
}

export const GET = async (req: Request, { params }: { params: Promise<{ conversationsId: string }> }) => {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.id) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const resolvedParams = await params;
        const convoId = resolvedParams.conversationsId;
        if (!convoId) {
            return new NextResponse('Conversation ID missing', { status: 400 });
        }

        const { searchParams } = new URL(req.url);
        const cursor = searchParams.get('cursor') ?? undefined;

        const result = await MessageService.getMessages({
            conversationId: convoId,
            cursor,
        });

        return NextResponse.json(result, { status: 200 });
    } catch (error) {
        console.error("Error fetching messages:", error);
        return NextResponse.json({ message: "Error while fetching messages" }, { status: 500 });
    }
}