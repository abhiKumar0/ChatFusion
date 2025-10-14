import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";


export const GET = async (req: Request, {params} : {params: Promise<{conversationsId: string}>}) => {
    try {
        const resolvedParams = await params;
        const convoId = resolvedParams.conversationsId;

        console.log("Convo ",convoId)
        const conversation = await prisma.conversation.findUnique({
            where: {id : convoId},
            include: {
                participants: {include: {user: {select: {id: true, email: true, username: true, fullName: true, avatar: true, publicKey: true,encryptedPrivateKey: true}}}},
            }
        });

        if (!conversation) {
            return NextResponse.json({message: "Conversation doesn't exist"}, {status: 404});
        }

        return NextResponse.json({conversation, message: "Conversation Fetched"}, {status: 201});
    } catch (error) {
        console.log(error);
        return NextResponse.json({message: "Error while fetching conversation"}, {status: 500});
    }
}