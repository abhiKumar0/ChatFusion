import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient();
        

        const {data: {user}} = await supabase.auth.getUser();
       
        if (!user) {
            return NextResponse.json({message: "Unauthorize"}, {status: 403})
        }

        const userId = user.id;

        const { count, error } = await supabase
            .from("FriendRequest")
            .select("*", { count: "exact", head: true })
            .eq("receiverId", userId)
            .eq("status", "PENDING");

        // console.log("Count", count);
        if (error) {
            // console.log("Count error",error)
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        return NextResponse.json({ count });
    } catch (error) {
        console.error("Error fetching friend request count:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}