import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export const GET = async () => {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.id) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        // Fetch conversations
        const data = await prisma.conversation.findMany({
            where: {
                participants: {
                    some: {
                        userId: user.id
                    }
                }
            },
            include: {
                participants: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                username: true,
                                email: true,
                                fullName: true,
                                avatar: true,
                                publicKey: true
                            }
                        }
                    }
                },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    select: {
                        id: true,
                        content: true,
                        type: true,
                        status: true,
                        createdAt: true,
                        senderId: true,
                        nonce: true
                    }
                }
            },
            orderBy: { updatedAt: 'desc' }
        });

        // Calculate unread count using prisma group by or count
        // For simplicity and speed in a list view, we can do an aggregation per conversation or just fetch counts.
        // Let's fetch counts of unread messages for the current user in these conversations.
        const unreadCounts = await prisma.message.groupBy({
            by: ['conversationId'],
            where: {
                conversationId: { in: data.map(c => c.id) },
                senderId: { not: user.id },
                status: { not: 'seen' }
            },
            _count: {
                id: true
            }
        });

        const unreadMap = new Map(unreadCounts.map(u => [u.conversationId, u._count.id]));

        // Build last message data and unread count for each conversation
        const processedData = data.map((convo: any) => {
            const lastMsg = convo.messages.length > 0 ? convo.messages[0] : null;

            return {
                ...convo,
                allParticipants: convo.participants, // maintain compatibility with UI expecting allParticipants
                lastMessage: lastMsg?.content,
                lastMessageData: lastMsg,
                unreadCount: unreadMap.get(convo.id) || 0
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

        // Check for existing conversation with exactly these two participants
        const existingConvos = await prisma.conversation.findMany({
            where: {
                type: 'ONE_TO_ONE',
                AND: [
                    { participants: { some: { userId: user.id } } },
                    { participants: { some: { userId: recipientId } } }
                ]
            },
            include: {
                participants: true
            }
        });

        // Filter to ensure it has exactly 2 participants
        let convId = existingConvos.find(c => c.participants.length === 2)?.id;

        if (!convId) {
            // Create a new conversation
            const newConvo = await prisma.conversation.create({
                data: {
                    type: 'ONE_TO_ONE',
                    participants: {
                        create: [
                            { userId: user.id, role: 'ADMIN' },
                            { userId: recipientId, role: 'MEMBER' }
                        ]
                    }
                }
            });
            convId = newConvo.id;
        }

        // Fetch the full object to return to the UI
        const fullChat = await prisma.conversation.findUnique({
            where: { id: convId },
            include: {
                participants: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                username: true,
                                email: true,
                                fullName: true,
                                avatar: true,
                                publicKey: true
                            }
                        }
                    }
                },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    select: {
                        id: true,
                        content: true,
                        type: true,
                        status: true,
                        createdAt: true,
                        senderId: true,
                        nonce: true
                    }
                }
            }
        });

        const formattedChat = {
            ...fullChat,
            allParticipants: fullChat?.participants
        };

        return NextResponse.json(formattedChat);
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
};