import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
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
        const participant = await prisma.conversationParticipant.findFirst({
            where: {
                conversationId: convoId,
                userId: userId
            },
            select: { conversationId: true }
        });

        if (!participant) {
            return NextResponse.json({ message: "Conversation not found or you are not a participant" }, { status: 404 });
        }

        // Create message with initial 'sent' status
        const newMessage = await prisma.message.create({
            data: {
                senderId: userId,
                content: content || '',
                media: media,
                conversationId: convoId,
                parentMessageId: parentId,
                nonce: nonce || (content ? randomBytes(12).toString('base64') : ''),
                type: messageType,
                status: 'sent'
            },
            include: {
                sender: true,
                parentMessage: {
                    include: {
                        sender: true
                    }
                }
            }
        });

        // 4. Update the conversation's updatedAt timestamp
        await prisma.conversation.update({
            where: { id: convoId },
            data: { updatedAt: new Date() }
        });

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

        let messages;

        if (cursor) {
            const cursorMsg = await prisma.message.findUnique({
                where: { id: cursor },
                select: { createdAt: true }
            });

            if (!cursorMsg) {
                return NextResponse.json({message: "Error while fetching cursor message"}, {status: 500});
            }

            messages = await prisma.message.findMany({
                where: {
                    conversationId: convoId,
                    createdAt: { lt: cursorMsg.createdAt }
                },
                take: MESSAGE_BATCH_SIZE,
                orderBy: { createdAt: 'desc' },
                include: {
                    sender: {
                        select: { id: true, fullName: true, username: true, publicKey: true, email: true }
                    },
                    parentMessage: {
                        include: {
                            sender: {
                                select: { id: true, fullName: true, username: true }
                            }
                        }
                    },
                    reactions: {
                        include: {
                            user: {
                                select: { id: true, fullName: true, username: true }
                            }
                        }
                    }
                }
            });
        } else {
            messages = await prisma.message.findMany({
                where: { conversationId: convoId },
                take: MESSAGE_BATCH_SIZE,
                orderBy: { createdAt: 'desc' },
                include: {
                    sender: {
                        select: { id: true, fullName: true, username: true, publicKey: true, email: true }
                    },
                    parentMessage: {
                        include: {
                            sender: {
                                select: { id: true, fullName: true, username: true }
                            }
                        }
                    },
                    reactions: {
                        include: {
                            user: {
                                select: { id: true, fullName: true, username: true }
                            }
                        }
                    }
                }
            });
        }

        let nextCursor = null;

        if (messages.length === MESSAGE_BATCH_SIZE) {
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