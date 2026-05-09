import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const DELETE = async (req: Request, {params}: {params: Promise<{messageId: string}>}) => {
    try {
        console.log("DELELELELETEEEE")
        const {messageId} = await params;
        const {searchParams} = new URL(req.url);
        const deleteType = searchParams.get("deleteType");
        const conversationId = searchParams.get("conversationId");
        const supabase = await createClient();
        const {data: {user}} = await supabase.auth.getUser();

        if (!user?.id) {
            return NextResponse.json({message: "Unauthorized"}, {status: 401});
        }

        if (deleteType === "ALL") {
            if (!conversationId) {
                return NextResponse.json({message: "conversationId is required for delete ALL"}, {status: 400});
            }
            await prisma.message.deleteMany({
                where: {
                    id: messageId,
                    conversationId: conversationId,
                    senderId: user.id
                }
            });
        } else if (deleteType === "SELF") {
            await prisma.messageVisibility.create({
                data: {
                    messageId: messageId,
                    userId: user.id,
                }
            });
        }         

        return NextResponse.json({message: "Message deleted successfully"}, {status: 200});
        
    } catch (error) {
        console.log("Error while deleting message", error);
        return NextResponse.json({message: "Could not delete the message"}, {status: 500});
    }
}