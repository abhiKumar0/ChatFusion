import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import redis from "@/lib/redis";

export const dynamic = 'force-dynamic'; 

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { receiverId, offerSdp, isVideo } = await request.json();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: call, error } = await supabase
      .from('calls')
      .insert({
        caller_id: user.id,
        receiver_id: receiverId,
        status: 'PENDING',
        offer_sdp: offerSdp,
        is_video: isVideo ?? true, // Default to true if not provided
      })
      .select(`
        *,
        caller:User!caller_id(*),
        receiver:User!receiver_id(*)
      `)
      .single();

    if (error) {
      console.error("Error creating call:", error);
      return NextResponse.json({ error: "Failed to create call" }, { status: 500 });

    }
    
      // 🔴 Notify receiver instantly via Redis
      // Store call data with 60s TTL — if not answered, it expires

      await redis.set(`call:pending:${receiverId}`, JSON.stringify(call), { ex: 60 });
    

    return NextResponse.json(call);
  } catch (error) {
    console.error("Internal server error in call initiation:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
