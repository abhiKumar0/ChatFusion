import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
        const user = await prisma.user.findUnique({
            where: { username: username }
        });

        console.log(user)
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        let friendshipStatus: 'FRIEND' | 'REQUEST_SENT' | 'REQUEST_RECEIVED' | 'NONE' | 'SELF' = 'NONE';
        let friendshipId: string | undefined = undefined;

        if (currentUser && currentUser.id !== user.id) {
            // Check friendship status
            const requestData = await prisma.friendRequest.findFirst({
                where: {
                    OR: [
                        { senderId: currentUser.id, receiverId: user.id },
                        { senderId: user.id, receiverId: currentUser.id }
                    ]
                }
            });

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
