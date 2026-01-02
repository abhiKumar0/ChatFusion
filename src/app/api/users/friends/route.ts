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

        // Fetch accepted friend requests
        const { data: friendRequests, error } = await supabase
            .from('FriendRequest')
            .select('*')
            .or(`senderId.eq.${userId},receiverId.eq.${userId}`)
            .eq('status', 'ACCEPTED');

        if (error) {
            console.error("Error fetching friends:", error);
            return NextResponse.json({ message: "Error fetching friends" }, { status: 500 });
        }

        if (!friendRequests || friendRequests.length === 0) {
            return NextResponse.json({ friends: [] }, { status: 200 });
        }

        // Get all user IDs involved (both senders and receivers)
        const userIds = new Set<string>();
        friendRequests.forEach((request: any) => {
            userIds.add(request.senderId);
            userIds.add(request.receiverId);
        });

        // Fetch all user data
        const { data: users, error: userError } = await supabase
            .from('User')
            .select('id, username, fullName, avatar')
            .in('id', Array.from(userIds));

        if (userError) {
            console.error("Error fetching user data:", userError);
            return NextResponse.json({ message: "Error fetching user data" }, { status: 500 });
        }

        // Create a map for quick user lookup
        const userMap = new Map(users?.map(u => [u.id, u]) || []);

        // Extract friends (the other user in each friend request)
        const friends = friendRequests.map((request: any) => {
            const friendId = request.senderId === userId ? request.receiverId : request.senderId;
            return userMap.get(friendId);
        }).filter(Boolean); // Remove any null/undefined values

        return NextResponse.json({ friends }, { status: 200 });

    } catch (error) {
        console.error("Error in friends route:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}
