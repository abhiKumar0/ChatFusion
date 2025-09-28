import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const POST = async (req: Request) => {
    try {
        const userId = req.headers.get("x-user-id");
        const { receiverId, content, media, parentId } = await req.json();

        if (!userId) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        if (!receiverId) {
            return NextResponse.json({ message: "Recipient not specified" }, { status: 400 });
        }

        if (!content && !media) {
            return NextResponse.json({ message: "Message content cannot be empty" }, { status: 400 });
        }

        const newMessage = await prisma.message.create({
            data: {
                senderId: userId,
                receiverId,
                content,
                media,
                parentMessageId: parentId,
            },
            include: {
                sender: true,
                receiver: true,
                parentMessage: true
            }
        });

        return NextResponse.json(newMessage, { status: 201 });

    } catch (error) {
        console.log(error);
        return NextResponse.json({ message: "Error while sending a message" }, { status: 500 });
    }
}

const MESSAGE_BATCH_SIZE = 50;

export const GET = async (req: Request) => {
    try {
        const userId = req.headers.get("x-user-id");
        const { searchParams } = new URL(req.url);
        const recipientId = searchParams.get('recipientId');
        const cursor = searchParams.get('cursor');

        if (!userId) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        if (!recipientId) {
            return new NextResponse('Recipient ID missing', { status: 400 });
        }

        const messages = await prisma.message.findMany({
            take: MESSAGE_BATCH_SIZE,
            skip: cursor ? 1 : 0,
            cursor: cursor ? { id: cursor } : undefined,
            where: {
                OR: [
                    {
                        senderId: userId,
                        receiverId: recipientId,
                    },
                    {
                        senderId: recipientId,
                        receiverId: userId,
                    },
                ],
            },
            include: {
                sender: {
                    select: { fullName: true, id: true, username: true },
                },
            },
            orderBy: {
                createdAt: "desc"
            }
        });

        let nextCursor = null;

        if (messages.length === MESSAGE_BATCH_SIZE) {
            nextCursor = messages[MESSAGE_BATCH_SIZE - 1].id;
        }

        return NextResponse.json({
            messages, nextCursor
        }, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: "Error while fetching messages" }, { status: 500 });
    }
}
