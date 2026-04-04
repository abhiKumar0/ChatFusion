import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import redis from "@/lib/redis";

const CONVO_QUERY = `
    *,
    participants:ConversationParticipant!inner(userId),
    allParticipants:ConversationParticipant(
        role,
        user:User(id, username, email, fullName, avatar, publicKey)
    ),
    messages:Message(id, content, type, status, createdAt, senderId, nonce)
`;

export const GET = async () => {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.id) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        // Fetch conversations
        const { data, error } = await supabase
            .from('Conversation')
            .select(CONVO_QUERY)
            .eq('participants.userId', user.id)
            .order('updatedAt', { ascending: false }); // Assuming Conversation has updatedAt

        if (error) throw error;


        const unreadCounts = await redis.hgetall(`unread:${user.id}`) as Record<string, string> || {};

        // Build last message data and unread count for each conversation
        const processedData = data.map((convo: any) => {
            // Sort messages by date desc
            const messages = convo.messages || [];
            messages.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

            const lastMsg = messages.length > 0 ? messages[0] : null;

            return {
                ...convo,
                lastMessage: lastMsg?.content, // Maintain backward compatibility
                lastMessageData: lastMsg ? {
                    id: lastMsg.id,
                    content: lastMsg.content,
                    type: lastMsg.type,
                    status: lastMsg.status,
                    senderId: lastMsg.senderId,
                    createdAt: lastMsg.createdAt,
                    nonce: lastMsg.nonce // Include nonce for decryption
                } : null,
                unreadCount: parseInt(unreadCounts?.[convo.id] || '0')
            };
        });

        return NextResponse.json(processedData);
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
};

export const POST = async (req: Request) => {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.id) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const { recipientId } = await req.json();

        // Use RPC: Atomically checks for existing chat OR creates a new one + participants
        const { data: convId, error: rpcError } = await supabase
            .rpc('get_or_create_conversation', { recipient_id: recipientId });

        if (rpcError) throw rpcError;

        // Fetch the full object to return to the UI
        const { data: fullChat, error: fetchError } = await supabase
            .from('Conversation')
            .select(CONVO_QUERY)
            .eq('id', convId)
            .single();

        if (fetchError) throw fetchError;
        return NextResponse.json(fullChat);
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
};