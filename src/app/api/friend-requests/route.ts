import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { senderId, receiverId } = await req.json();

  const { data: friendRequest, error } = await supabase
    .from('FriendRequest')
    .insert({
      senderId,
      receiverId,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ message: "Error creating friend request" }, { status: 500 });
  }

  return NextResponse.json(friendRequest);
}
