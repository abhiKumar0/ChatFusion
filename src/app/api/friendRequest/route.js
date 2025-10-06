import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Send a friend request
export async function POST(request) {
  try {
    const { receiverId } = await request.json();
    const senderId = request.headers.get("x-user-id");
    if (!senderId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (senderId === receiverId) { 
      return NextResponse.json(
        { error: "You cannot send a friend request to yourself" },
        { status: 400 }
      );
    }

    const existingRequest = await prisma.friendRequest.findFirst({
      where: {
        OR: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId },
        ],
      },
    });

    if (existingRequest) {
      return NextResponse.json(
        { error: "Friend request already sent or you are already friends" },
        { status: 400 }
      );
    }

    const friendRequest = await prisma.friendRequest.create({
      data: {
        senderId,
        receiverId,
        status: "PENDING", // Ensure status is set
      },
    });

    return NextResponse.json(friendRequest);
  } catch (error) {
    console.error("Error sending friend request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Accept or decline a friend request
export async function PUT(request) {
  try {
    const { friendRequestId, status } = await request.json();
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const friendRequest = await prisma.friendRequest.findUnique({
      where: { id: friendRequestId },
    });

    if (!friendRequest || friendRequest.receiverId !== userId) {
      return NextResponse.json(
        { error: "Friend request not found or you are not the receiver" },
        { status: 404 }
      );
    }

    if (status !== "ACCEPTED" && status !== "DECLINED") {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const updatedRequest = await prisma.friendRequest.update({
      where: { id: friendRequestId },
      data: { status },
    });

    let conversation = null;
    if (status === "ACCEPTED") {
      // Create a new conversation for the one-to-one chat
      conversation = await prisma.conversation.create({
        data: {
          type: "ONE_TO_ONE",
          participants: {
            create: [
              { userId: friendRequest.senderId },
              { userId: friendRequest.receiverId },
            ],
          },
        },
      });
    }

    return NextResponse.json({ updatedRequest, conversation });
  } catch (error) {
    console.error("Error updating friend request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Get all friend requests for the logged-in user
export async function GET(request) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const friendRequests = await prisma.friendRequest.findMany({
      where: {
        receiverId: userId,
        status: "PENDING",
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    return NextResponse.json(friendRequests, { status: 200 });
  } catch (error) {
    console.error("Error fetching friend requests:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}