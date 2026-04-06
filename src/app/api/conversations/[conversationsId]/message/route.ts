import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import redis from "@/lib/redis";
import { rateLimit } from "@/lib/rateLimit"


export const dynamic = 'force-dynamic'; 

export const POST = async (req: Request, { params }: { params: Promise<{ conversationsId: string }> }) => {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        const userId = user?.id;

        const resolvedParams = await params;
        const convoId = resolvedParams.conversationsId;
        const { parentId, content, media, nonce, type } = await req.json();

        
        if (!userId) {
            return NextResponse.json({ message: "Unauthorize" }, { status: 401 });
        }
        
        if (!(content || media)) {
            return NextResponse.json({ message: "Message content cannot be empty" }, { status: 400 });
        }
        
        const { success, remaining } = await rateLimit(user.id);

        if (!success) {
            return NextResponse.json({error: "Too many messages. Slow down."}, {
                status: 429,
                headers: { 'X-RateLimit-Remaining' : '0'}
            });
        } 



        // Determine message type
        const hasContent = content && content.trim() !== '';
        const messageType = type || (media && !hasContent ? 'IMAGE' : 'TEXT');

        // Verify user is part of this conversation
        const { data: participant } = await supabase
            .from('ConversationParticipant')
            .select('conversationId')
            .eq('conversationId', convoId)
            .eq('userId', userId)
            .single();

        if (!participant) {
            return NextResponse.json({ message: "Conversation not found or you are not a participant" }, { status: 404 });
        }

        // Create message with initial 'sent' status
        const { data: newMessage, error: createError } = await supabase
            .from('Message')
            .insert({
                senderId: userId,
                content: content || '',
                media,
                conversationId: convoId,
                parentMessageId: parentId,
                nonce: nonce || (content ? randomBytes(12).toString('base64') : ''),
                type: messageType,
                status: 'sent', // Initial status when message is created
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            })
            .select(`
                *,
                sender:User(*),
                parentMessage:Message!parentMessageId(
                    *,
                    sender:User(*)
                )
            `)
            .single();

        if (createError) throw createError;

        // 4. Update the conversation's updatedAt timestamp
        await supabase
            .from('Conversation')
            .update({ updatedAt: new Date().toISOString() })
            .eq('id', convoId);

        return NextResponse.json(newMessage, { status: 201 });

    } catch (error) {
        console.log(error);
        return NextResponse.json({ message: "Error while sending a message" }, { status: 500 })
    }
}

const MESSAGE_BATCH_SIZE = 50;

export const GET = async (req: Request, { params }: { params: Promise<{ conversationsId: string }> }) => {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        const userId = user?.id;

        const resolvedParams = await params;
        const convoId = resolvedParams.conversationsId;

        if (!userId) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        if (!convoId) {
            return new NextResponse('Conversation ID missing', { status: 400 });
        }

        //Search Params
        const { searchParams } = new URL(req.url);
        const cursor = searchParams.get('cursor');


        let query = supabase
            .from('Message')
            .select(`
                *,
                sender:User(id, fullName, username, publicKey, email),
                parentMessage:parentMessageId(
                    *,
                    sender:User(id, fullName, username)
                ),
                reactions:Reaction(
                    *,
                    user:User(id, fullName, username)
                )
            `)
            .eq('conversationId', convoId)
            .order('createdAt', { ascending: false })
            .limit(MESSAGE_BATCH_SIZE);

        if (cursor) {
            // Fetch the createdAt of the cursor message to paginate efficiently
            // Or if IDs are time-sortable (CUIDs are), we can use lt
            // Assuming CUIDs/UUIDs, let's try to fetch the cursor message first
            const { data: cursorMsg, error: createError } = await supabase
                .from('Message')
                .select('createdAt')
                .eq('id', cursor)
                .single();

            if (createError) {
                return NextResponse.json({message: "Error while fetching cursor message"}, {status: 500});
            }

            // Increment unread count for the other participant
            const { data: otherParticipant } = await supabase
                .from('ConversationParticipant')
                .select('userId')
                .eq('conversationId', convoId)
                .neq('userId', userId)
                    .single();

                if (otherParticipant?.userId) {
                    await redis.hincrby(`unread:${otherParticipant.userId}`, convoId, 1);
                }


            if (cursorMsg) {
                query = query.lt('createdAt', cursorMsg.createdAt);
            }
        }

        const { data: messages, error } = await query;

        if (error) throw error;

        let nextCursor = null;

        if (messages && messages.length === MESSAGE_BATCH_SIZE) {
            nextCursor = messages[MESSAGE_BATCH_SIZE - 1].id;
        }

        return NextResponse.json({
            messages: messages || [],
            nextCursor
        }, { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: "Error while fetching message" }, { status: 500 });
    }
}