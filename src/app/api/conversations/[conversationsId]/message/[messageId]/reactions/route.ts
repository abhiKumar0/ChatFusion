import { prisma } from "@/lib/prisma";

import { NextResponse } from "next/server";

// Add a reaction to a message
export const POST = async (
  req: Request,
  { params }: { params: Promise<{ conversationsId: string; messageId: string }> }
) => {
  try {
    const userId = req.headers.get("x-user-id");
    if (!userId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { conversationsId, messageId } = await params;
    const { emoji } = await req.json();
    if (!emoji) return NextResponse.json({ message: "Emoji is required" }, { status: 400 });

    // Ensure message is in conversation and user participates
    const message = await prisma.message.findFirst({
      where: { id: messageId, conversationId: conversationsId },
    });
    if (!message) return NextResponse.json({ message: "Message not found" }, { status: 404 });

    const reaction = await prisma.reaction.upsert({
      where: { userId_messageId_emoji: { userId, messageId, emoji } },
      create: { userId, messageId, emoji },
      update: {},
      include: { 
        user: {
          select: { id: true, fullName: true, username: true }
        }
      },
    });

    // Emit socket event for real-time updates


    return NextResponse.json(reaction);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Error adding reaction" }, { status: 500 });
  }
};

// Remove a reaction from a message
export const DELETE = async (
  req: Request,
  { params }: { params: Promise<{ conversationsId: string; messageId: string }> }
) => {
  try {
    const userId = req.headers.get("x-user-id");
    if (!userId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { messageId } = await params;
    const { emoji } = await req.json();
    if (!emoji) return NextResponse.json({ message: "Emoji is required" }, { status: 400 });

    await prisma.reaction.delete({
      where: { userId_messageId_emoji: { userId, messageId, emoji } },
    });

    // Emit socket event for real-time updates


    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Error removing reaction" }, { status: 500 });
  }
};


