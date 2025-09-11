import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const GET = async (req: Request) => {
    try {
        const userId = req.headers.get("x-user-id");

        if (!userId) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }
        
        const conversations = await prisma.conversation.findMany({
            where: {
                participants: {some : {userId}}
            },
            include: {
                participants: {
                    include: {
                        user: {select: { id: true, username: true, email: true, fullName: true, avatar: true }}
                    }
                }
            }
        })
        

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
        const userId = request.headers.get("x-user-id");
        const {recipientId } = await request.json();
        if (!userId) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        const chat = await prisma.conversation.findFirst({
            where: {
                AND: [
                    {participants : {some: {userId}}},
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
                        {userId},
                        {userId: recipientId}
                    ]
                },
                messages: {
                    create: []
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