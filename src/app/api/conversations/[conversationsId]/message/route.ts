//Fetch current user
//Fetch Conversation, also validate
//Create a new Message
//save in db

// model Message {
//   id String @id @default(cuid())

//   // Relations to User
//   sender     User   @relation(fields: [senderId], references: [id])
//   senderId   String

//   // Self-relation for replies
//   parentMessage   Message?  @relation("MessageReplies", fields: [parentMessageId], references: [id])
//   parentMessageId String?

//   replies         Message[] @relation("MessageReplies")

//   seen           Boolean   @default(false)
//   media          String?

//   content   String
//   createdAt DateTime @default(now())
//   updatedAt DateTime @updatedAt

//   Conversation Conversation[]
// }

import { prisma } from "@/lib/prisma";
import { getIO } from "@/lib/socket-server";
import { NextResponse } from "next/server";
import { randomBytes } from "crypto";

export const POST = async (req: Request, {params} : {params: Promise<{conversationsId: string}>}) => {
    try {
        const userId = req.headers.get("x-user-id");
        const resolvedParams = await params;
        const convoId = resolvedParams.conversationsId;
        const {parentId, content, media, nonce} = await req.json();

        if (!userId) {
            return NextResponse.json({message: "Unauthorize"}, {status: 401});
        }

        if (!(content || media)) {
            return NextResponse.json({message: "Message content cannot be empty"}, {status: 400});
        }
        console.log(convoId)
        // 1. Find the conversation and ensure the user is a participant
        const conversation = await prisma.conversation.findUnique({
            where: {
                id: convoId,
                participants: {
                    some: {
                        userId: userId
                    }
                }
            },
            include: {
                participants: true // Include participants to validate
            }
        });
        console.log("Convo", conversation)

        // 2. If conversation doesn't exist or user is not a part of it, return error
        if (!conversation) {
            return NextResponse.json({ message: "Conversation not found or you are not a participant" }, { status: 404 });
        }

        // 3. Create the new message
        const newMessage = await prisma.message.create({
            data: {
                senderId: userId,
                content,
                media,
                conversationId: convoId,
                parentMessageId: parentId,
                nonce: nonce || randomBytes(12).toString('base64'),
            },
            include: {
                sender: true, // Optionally include sender details
                parentMessage: true // Optionally include replied-to message
            }
        });

        // 4. (Optional but recommended) Update the conversation's updatedAt timestamp
        await prisma.conversation.update({
            where: {
                id: convoId,
            },
            data: {
                // This implicitly updates the updatedAt field if your schema is configured for it.
                // If not, you can manually set it: updatedAt: new Date()
            }
        });

        // Note: Real-time updates are handled client-side via socket emission
        // This avoids the Socket.IO initialization issue in API routes

        return NextResponse.json(newMessage, {status: 201});
        
    } catch (error) {
        console.log(error);
        return NextResponse.json({message: "Error while sending a message"}, {status: 500})
    }
}



//Get convoId from param
//Get messages in decs order based on date
//Send in chunk, last message per call

const MESSAGE_BATCH_SIZE = 50;

export const GET = async (req: Request, {params} : {params: Promise<{conversationsId: string}>}) => {
    try {
        const userId = req.headers.get("x-user-id");
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
        const cursor = searchParams.get('cursor');//id of last message

        //Query
        const messages = await prisma.message.findMany({

            //How many to fetch
            take: MESSAGE_BATCH_SIZE,

            //If cursor is not null, Skip the message with that id
            skip: cursor ? 1 : 0,

            //Fetch from cursor's position
            cursor: cursor ? {id: cursor} : undefined,
            
            where: {
                conversationId: convoId,
            },

            include: {
                sender: {
                    select: {fullName: true, id: true, username: true, encryptedPrivateKey: true, publicKey: true, email: true},
                },
            },
            
            //sort messages in descending order based on createdAt
            orderBy: {
                createdAt: "desc"
            }
        });

        let nextCursor = null;

        if (messages.length === MESSAGE_BATCH_SIZE) {
            nextCursor = messages[MESSAGE_BATCH_SIZE-1].id;
        }

        return NextResponse.json({
            messages, nextCursor
        }, {status: 201});
    } catch (error) {
        console.error(error);
        return NextResponse.json({message: "Error while fetching message"}, {status: 500});
    }
}