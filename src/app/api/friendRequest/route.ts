import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";

//Get Requests
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = user.id;

        // Get friend requests
        const friendRequests = await prisma.friendRequest.findMany({
            where: {
                receiverId: userId,
                status: 'PENDING'
            },
            include: {
                sender: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return NextResponse.json(friendRequests, { status: 200 });
    } catch (error) {
        console.error("Error in friend request API:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

//Send request
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { receiverId } = await request.json();

        if (!receiverId) {
            return NextResponse.json({ error: "Receiver ID is required" }, { status: 400 });
        }

        // Check if friendship already exists
        const existingFriendship = await prisma.friendRequest.findFirst({
            where: {
                OR: [
                    { senderId: user.id, receiverId: receiverId },
                    { senderId: receiverId, receiverId: user.id }
                ]
            }
        });

        if (existingFriendship) {
            return NextResponse.json({ error: "Friendship already exists or request already sent" }, { status: 400 });
        }

        // Create friend request
        const friendship = await prisma.friendRequest.create({
            data: {
                senderId: user.id,
                receiverId: receiverId,
                status: 'PENDING',
            }
        });

        // Notify receiver instantly via Socket.IO
        const io = (global as any).io;
        if (io) {
            io.to(`user:${receiverId}`).emit('friend_request:new', friendship);
        }

        return NextResponse.json(friendship, { status: 201 });

    } catch (error) {
        console.error("Error in friend request API:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

//Cancel, Decline , remove Friend Request
export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createClient();

        // 1. Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        
        const userId = user.id;
        const { searchParams } = new URL(request.url);
        const requestId = searchParams.get("friendRequestId");

        if (!requestId) {
            return NextResponse.json({ error: "Friend Request ID is required" }, { status: 400 });
        }

        // 2. SECURITY CHECK: Delete ONLY if the user is the sender OR the receiver
        await prisma.friendRequest.deleteMany({
            where: {
                id: requestId,
                OR: [
                    { senderId: userId },
                    { receiverId: userId }
                ]
            }
        });
        
        return NextResponse.json({ message: "Friend request processed successfully" }, { status: 200 });

    } catch (error) {
        console.error("Error in friend request delete API:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

//Accept Friend Request
export async function PATCH(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const {searchParams} = new URL(request.url);
        const requestId = searchParams.get("friendRequestId");

        if (!requestId) {
            return NextResponse.json({ error: "Request ID is required" }, { status: 400 });
        }

        // Update the friendship status to ACCEPTED
        const friendship = await prisma.friendRequest.updateMany({
            where: {
                id: requestId,
                receiverId: user.id
            },
            data: {
                status: 'ACCEPTED'
            }
        });

        // updateMany doesn't return the updated record. If we need to return it, we should find it first.
        // For simplicity, we can just return a success message or fetch the updated record.
        const updatedFriendship = await prisma.friendRequest.findUnique({
            where: { id: requestId }
        });

        return NextResponse.json(updatedFriendship, { status: 200 });
        
    } catch (error) {
        console.error("Error in friend request update API:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
