import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient();
        
        const {data: {user}} = await supabase.auth.getUser();
       
        if (!user) {
            return NextResponse.json({message: "Unauthorize"}, {status: 403})
        }

        const userId = user.id;

        const count = await prisma.friendRequest.count({
            where: {
                receiverId: userId,
                status: 'PENDING'
            }
        });

        return NextResponse.json({ count });
    } catch (error) {
        console.error("Error fetching friend request count:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}