import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const GET = async () => {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }
        const conversations = await prisma.conversation.findMany({
            orderBy: { createdAt: 'desc' },
            where: {
                participants: { some: { userId: currentUser.id } },
            },
            include: { //Include means which fields to show in associated tables
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1, // Fetch only the last message for preview
                },
                participants: {
                    include: {
                        user: {
                            select: { id: true, username: true, email: true, fullName: true, avatar: true },
                        },
                    },
                },
            },
        });

        return NextResponse.json(conversations);
        
    } catch (error) {
        return NextResponse.json(
            { message: "Internal Server Error while getting convo" },
            { status: 500 }
        );
    }
}

export const POST = async (request : Request) => {
    try {
        const currentUser = await getCurrentUser();
        const {recipientId } = await request.json();

        if (!currentUser) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        const chat = await prisma.conversation.findFirst({
            where: {
                AND: [
                    {participants : {some: {userId: currentUser.id}}},
                    {participants : {some: {userId: recipientId}}},
                ]
            }
        });

        if (chat) {
            return NextResponse.json(chat);
        }

        const newChat = await prisma.conversation.create({
            data: {
                participants: {
                    create: [
                        {userId: currentUser.id},
                        {userId: recipientId}
                    ]
                }
            },
            include: {
                participants: {
                    include: {
                        user: {select: { id: true, username: true, email: true, fullName: true, avatar: true }}
                    }
                }
            }
        });

        return NextResponse.json(newChat);
    } catch (error) {
        console.error('[CONVERSATIONS_POST]', error);
        return new NextResponse('Internal Error while creating convo', { status: 500 });
    }
}