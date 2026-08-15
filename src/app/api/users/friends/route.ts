import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const GET = async (request: Request) => {
    try {
        const supabase = await createClient();
        
        const { data: { user: authUser } } = await supabase.auth.getUser();
        const userId = authUser?.id;

        if (!userId) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        // Fetch accepted friend requests
        const friendRequests = await prisma.friendRequest.findMany({
            where: {
                OR: [
                    { senderId: userId },
                    { receiverId: userId }
                ],
                status: 'ACCEPTED'
            }
        });

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
        const users = await prisma.user.findMany({
            where: {
                id: { in: Array.from(userIds) }
            },
            select: {
                id: true,
                username: true,
                fullName: true,
                avatar: true
            }
        });

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
