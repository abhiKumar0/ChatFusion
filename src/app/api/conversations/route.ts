import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export const GET = async (req: Request) => {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        const userId = user?.id;

        if (!userId) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }
        
        console.log(1);
        // 1. Get conversation IDs where the user is a participant
        const { data: participantRows, error: participantError } = await supabase
            .from('ConversationParticipant')
            .select('conversationId')
            .eq('userId', userId);

        console.log(2);

        if (participantError) throw participantError;

        const conversationIds = participantRows.map(r => r.conversationId);

        if (conversationIds.length === 0) {
            return NextResponse.json([]);
        }

        console.log(3);

        // 2. Fetch conversations with details
        const { data: conversations, error: conversationError } = await supabase
            .from('Conversation')
            .select(`
                *,
                participants:ConversationParticipant(
                    *,
                    user:User(id, username, email, fullName, avatar, publicKey)
                )
            `)
            .in('id', conversationIds);

        console.log(4);
        if (conversationError) throw conversationError;

        return NextResponse.json(conversations);
        
    } catch (error) {
        console.log(error)
        return NextResponse.json(
            { message: "Internal Server Error while getting convo" },
            { status: 500 }
        );
    }
}

export const POST = async (request : Request) => {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        const userId = user?.id;
        
        const { recipientId } = await request.json();
        if (!userId) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        // Check if conversation already exists
        // Fetch user's conversations
        const { data: userConversations } = await supabase
            .from('ConversationParticipant')
            .select('conversationId')
            .eq('userId', userId);
            
        const userConversationIds = userConversations?.map(c => c.conversationId) || [];

        if (userConversationIds.length > 0) {
            // Check if recipient is in any of these conversations
            const { data: existingChat } = await supabase
                .from('ConversationParticipant')
                .select('conversationId')
                .eq('userId', recipientId)
                .in('conversationId', userConversationIds)
                .limit(1)
                .single();

            if (existingChat) {
                // Fetch full conversation details
                const { data: chat } = await supabase
                    .from('Conversation')
                    .select(`
                        *,
                        participants:ConversationParticipant(
                            *,
                            user:User(id, username, email, fullName, avatar)
                        )
                    `)
                    .eq('id', existingChat.conversationId)
                    .single();
                    
                return NextResponse.json(chat);
            }
        }

        // Create new conversation
        const { data: newChat, error: createError } = await supabase
            .from('Conversation')
            .insert({})
            .select()
            .single();

        if (createError) throw createError;

        // Add participants
        const { error: participantsError } = await supabase
            .from('ConversationParticipant')
            .insert([
                { userId: userId, conversationId: newChat.id },
                { userId: recipientId, conversationId: newChat.id }
            ]);

        if (participantsError) throw participantsError;

        // Fetch the newly created conversation with participants
        const { data: fullChat, error: fetchError } = await supabase
            .from('Conversation')
            .select(`
                *,
                participants:ConversationParticipant(
                    *,
                    user:User(id, username, email, fullName, avatar)
                )
            `)
            .eq('id', newChat.id)
            .single();

        if (fetchError) throw fetchError;

        return NextResponse.json(fullChat);
    } catch (error) {
        console.error('[CONVERSATIONS_POST]', error);
        return new NextResponse('Internal Error while creating convo', { status: 500 });
    }
}