import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const DELETE = async (request: Request, {params}: {params: Promise<{friendId: string}>}) => {
    try {

        const supabase = await createClient();
        const {data: { user }} = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({message: "Unauthorized"}, {status: 403});
        }
        const userId = user.id;
        const {friendId} = await params;
        if (!friendId) {
            return NextResponse.json({message: "Friend Id is required"});
        }

        const reqData = await prisma.friendRequest.findFirst({
            where: {
                OR: [
                    { senderId: userId, receiverId: friendId },
                    { senderId: friendId, receiverId: userId }
                ]
            }
        });

        if (!reqData) {
            return NextResponse.json({message: "No Connection exist"}, {status: 404});
        }

        await prisma.friendRequest.delete({
            where: { id: reqData.id }
        });

        return NextResponse.json({message: "Unfriended Successfully"}, {status: 200});

    } catch(err) {
        console.log("Remove Friend Error:",err);
        return NextResponse.json({error: err}, {status: 500})
    }
}