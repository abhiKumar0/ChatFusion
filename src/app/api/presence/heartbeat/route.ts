import redis from "@/lib/redis";
import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";


/*
    This route is called every 30 seconds by the client to update the user's presence.
    It uses Redis to store the user's last seen time.
    The key is "presence:<user_id>" and the value is the last seen time.
    The expiration is 60000 milliseconds (1 minute).
*/


export async function POST() {
    try {
        const supabase = await createClient();  
        const {data: {user}} = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({error: "Unauthorized"}, {status: 401});
        } 

        // Set online status with 60s TTL
        // If user closes tab, key expires automatically after 60s
        await redis.set(`user:online:${user.id}`, '1', { ex: 60 });
        return NextResponse.json({ success: true });
        
    } catch (error) {
        console.error("Error in heartbeat:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}