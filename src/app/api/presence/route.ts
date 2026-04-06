import redis from "@/lib/redis";
import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic'; 

export async function GET(req: Request) {
    try {
        const supabase = await createClient();
        const {data: {user}} = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({error: "Unauthorized"}, {status: 401});
        } 


        const { searchParams } = new URL(req.url);

        const ids = searchParams.get("ids")?.split(",").filter(Boolean) ?? [];

        if (ids.length === 0) {
            return NextResponse.json({});
        }


        //Check all user keys in paraller
        const keys = ids.map(id => `user:online:${id}`);
        const results = await redis.mget(...keys);

        const presenceMap: Record<string, boolean> = {};

        ids.forEach((id, index) => {
            presenceMap[id] = !!results[index];
        });

        return NextResponse.json(presenceMap);

    } catch (error) {
        console.error("Error in getting presence:", error);
        return NextResponse.json({error: "Internal Server Error"}, {status: 500});
    }
}