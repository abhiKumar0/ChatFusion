import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const GET = async (req: Request, {params} : {params: Promise<{conversationsId: string}>}) => {
    try {
        const supabase = await createClient();
        const resolvedParams = await params;
        const convoId = resolvedParams.conversationsId;

        const conversation = await prisma.conversation.findUnique({
            where: { id: convoId },
            include: {
                participants: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                email: true,
                                username: true,
                                fullName: true,
                                avatar: true,
                                publicKey: true
                            }
                        }
                    }
                }
            }
        });

        if (!conversation) {
            return NextResponse.json({message: "Conversation doesn't exist"}, {status: 404});
        }

        return NextResponse.json({conversation, message: "Conversation Fetched"}, {status: 200});
    } catch (error) {
        console.log(error);
        return NextResponse.json({message: "Error while fetching conversation"}, {status: 500});
    }
}


export const DELETE = async (req: Request, {params}: {params: Promise<{conversationsId: string}>}) => {
    try {
        const supabase = await createClient();
        const {conversationsId} = await params;
        const {searchParams} = new URL(req.url);
        const deleteFor = searchParams.get("deleteFor");
        
        const {data: {user}} = await supabase.auth.getUser();
        const userId = user?.id;

        if (!userId) {
            return NextResponse.json({message: "Unauthorized"}, {status: 401});
        }

        if (deleteFor === "ALL") {
            const count = await prisma.conversation.deleteMany({
                where: { id: conversationsId }
            });
            
            if (count.count === 0) {
                return NextResponse.json({message: "Forbidden Action not Allowed"}, {status: 403});
            }
        } else {
            await prisma.conversationParticipant.updateMany({
                where: {
                    conversationId: conversationsId,
                    userId: userId
                },
                data: {
                    lastDeletedAt: new Date()
                }
            });
        }

        return NextResponse.json({message: "Conversation deleted"}, {status: 201});
    } catch (err) {
        console.log(err);
        return NextResponse.json({message: "Error while deleting conversation"}, {status: 500});
    }
}