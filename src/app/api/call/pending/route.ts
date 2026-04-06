
/*

This route is called by the receiver to check if there is a pending call.


*/


import redis from "@/lib/redis";
import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";


export const dynamic = 'force-dynamic'; 

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    // Add this debug line
    // console.log('🔍 Pending call check - user:', user?.id, 'error:', error);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized', debug: 'no user' }, { status: 401 });
    }

    const data = await redis.get(`call:pending:${user.id}`);
    // console.log('🔍 Redis key:', `call:pending:${user.id}`, 'value:', data);

    if (!data) {
      return NextResponse.json({ call: null });
    }

    return NextResponse.json({ call: data });
  } catch (error) {
    console.error('Pending call fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

//For Rejecting call

export async function DELETE() {
    try {
        const supabase = await createClient();
        const {data: {user}} = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({error: "Unauthorized"}, {status: 401});
        }   

        const data = await redis.get(`call:pending:${user.id}`);
        if (!data) {
            return NextResponse.json({error: "No pending call"}, {status: 404});
        }

        await redis.del(`call:pending:${user.id}`);

        return NextResponse.json({status: 200, call:data});

    } catch (error) {
        console.error("Error in getting pending call:", error);
        return NextResponse.json({error: "Internal Server Error"}, {status: 500});
    }
}