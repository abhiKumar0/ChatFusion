import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export const GET = async (request: Request) => {
    try {
        const supabase = await createClient();
        
        const { data: { user: authUser } } = await supabase.auth.getUser();
        const userId = authUser?.id;

        if (!userId) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { data: friendRequests, error } = await supabase
            .from('FriendRequest')
            .select(`
                *,
                sender:User!FriendRequest_senderId_fkey(id, username, fullName, avatar),
                receiver:User!FriendRequest_receiverId_fkey(id, username, fullName, avatar)
            `)
            .or(`senderId.eq.${userId},receiverId.eq.${userId}`)
            .eq('status', 'ACCEPTED');

        if (error) {
            console.error("Error fetching friends:", error);
            return NextResponse.json({ message: "Error fetching friends" }, { status: 500 });
        }

        const friends = friendRequests.map((request: any) => {
            if (request.senderId === userId) {
                return request.receiver;
            } else {
                return request.sender;
            }
        });

        return NextResponse.json({ friends }, { status: 200 });

    } catch (error) {
        console.error("Error in friends route:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}
