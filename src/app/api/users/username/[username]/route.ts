import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ username: string }> }
) {
    try {
        const supabase = await createClient();
        const { username } = await params;

        // Get Current User
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        console.log(username)
        // Fetch Target User details
        const { data: user, error } = await supabase
            .from('User')
            .select('*')
            .eq('username', username)
            .single();

        console.log(user)
        if (error || !user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        let friendshipStatus: 'FRIEND' | 'REQUEST_SENT' | 'REQUEST_RECEIVED' | 'NONE' | 'SELF' = 'NONE';
        let friendshipId: string | undefined = undefined;

        if (currentUser && currentUser.id !== user.id) {
            // Check friendship status
            const { data: requestData } = await supabase
                .from('FriendRequest')
                .select('*')
                .or(`and(senderId.eq.${currentUser.id},receiverId.eq.${user.id}),and(senderId.eq.${user.id},receiverId.eq.${currentUser.id})`)
                .single();

            if (requestData) {
                friendshipId = requestData.id;
                if (requestData.status === 'ACCEPTED') {
                    friendshipStatus = 'FRIEND';
                } else if (requestData.senderId === currentUser.id) {
                    friendshipStatus = 'REQUEST_SENT';
                } else {
                    friendshipStatus = 'REQUEST_RECEIVED';
                }
            }
        } else if (currentUser && currentUser.id === user.id) {
            friendshipStatus = 'SELF';
        }

        return NextResponse.json({ ...user, friendshipStatus, friendshipId });
    } catch (error) {
        console.error("Error fetching user:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
