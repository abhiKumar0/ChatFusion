import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// Update a message (only by its sender)
export const PATCH = async (
  req: Request,
  { params }: { params: Promise<{ conversationsId: string; messageId: string }> }
) => {
  try {
    const userId = req.headers.get("x-user-id");
    if (!userId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { conversationsId, messageId } = await params;
    const { content, nonce } = await req.json();

    if (!content || typeof content !== "string") {
      return NextResponse.json({ message: "Content is required" }, { status: 400 });
    }

    if (!nonce || typeof nonce !== "string") {
      return NextResponse.json({ message: "Nonce is required" }, { status: 400 });
    }

    // Ensure message exists in conversation and user is the sender
    const message = await prisma.message.findFirst({
      where: { id: messageId, conversationId: conversationsId, senderId: userId },
    });
    if (!message) {
      return NextResponse.json({ message: "Message not found" }, { status: 404 });
    }

    const updated = await prisma.message.update({
      where: { id: messageId },
      data: { content, nonce },
      include: { sender: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Error updating message" }, { status: 500 });
  }
};

// Delete a message (only by its sender)
export const DELETE = async (
  req: Request,
  { params }: { params: Promise<{ conversationsId: string; messageId: string }> }
) => {
  try {
    const userId = req.headers.get("x-user-id");
    if (!userId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { conversationsId, messageId } = await params;

    // Ensure message exists in conversation and user is the sender
    const message = await prisma.message.findFirst({
      where: { id: messageId, conversationId: conversationsId, senderId: userId },
    });
    if (!message) {
      return NextResponse.json({ message: "Message not found" }, { status: 404 });
    }

    await prisma.message.delete({ where: { id: messageId } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Error deleting message" }, { status: 500 });
  }
};


