import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const supabase = await createClient();
    const { userId } = await params;

    // Fetch friends where user is sender OR receiver AND status is ACCEPTED
    const { data: friendRequests, error } = await supabase
        .from('FriendRequest')
        .select(`
            *,
            sender:User!FriendRequest_senderId_fkey(id, username, fullName, avatar, status),
            receiver:User!FriendRequest_receiverId_fkey(id, username, fullName, avatar, status)
        `)
        .or(`senderId.eq.${userId},receiverId.eq.${userId}`)
        .eq('status', 'ACCEPTED');

    if (error) {
        throw error;
    }

    const friends = friendRequests.map((request: any) => {
        if (request.senderId === userId) {
            return request.receiver;
        } else {
            return request.sender;
        }
    });

    return NextResponse.json(friends);
  } catch (error) {
    console.error("Error fetching user friends:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
