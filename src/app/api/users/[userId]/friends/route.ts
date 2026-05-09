import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const supabase = await createClient();
    const { userId } = await params;

    // Fetch friends where user is sender OR receiver AND status is ACCEPTED
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
        return NextResponse.json([]);
    }

    // Get all user IDs involved
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

    return NextResponse.json(friends);
  } catch (error) {
    console.error("Error fetching user friends:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
