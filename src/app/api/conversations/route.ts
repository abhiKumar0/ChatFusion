import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

const CONVO_QUERY = `
    *,
    participants:ConversationParticipant!inner(userId),
    allParticipants:ConversationParticipant(
        role,
        user:User(id, username, email, fullName, avatar)
    )
`;

export const GET = async () => {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.id) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        // Single query: Fetch conversations where the user is a participant
        const { data, error } = await supabase
            .from('Conversation')
            .select(CONVO_QUERY)
            .eq('participants.userId', user.id);
        console.log(data)
        if (error) throw error;
        return NextResponse.json(data);
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