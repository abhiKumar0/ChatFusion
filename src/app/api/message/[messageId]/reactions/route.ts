import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Add a reaction to a message
export const POST = async (
  req: Request,
  { params }: { params: Promise<{ messageId: string }> }
) => {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    if (!userId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    
    const { messageId } = await params;
    const { conversationId, emoji } = await req.json();
    
    if (!emoji) return NextResponse.json({ message: "Emoji is required" }, { status: 400 });

    // Ensure message is in conversation
    const message = await prisma.message.findFirst({
        where: {
            id: messageId,
            conversationId: conversationId
        },
        select: { id: true }
    });

    if (!message) return NextResponse.json({ message: "Message not found" }, { status: 404 });
    
    const reaction = await prisma.reaction.upsert({
        where: {
            userId_messageId_emoji: {
                userId,
                messageId,
                emoji
            }
        },
        update: {},
        create: {
            userId,
            messageId,
            emoji
        },
        include: {
            user: {
                select: {
                    id: true,
                    fullName: true,
                    username: true
                }
            }
        }
    });

    return NextResponse.json(reaction);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Error adding reaction" }, { status: 500 });
  }
};

// Remove a reaction from a message
export const DELETE = async (
  req: Request,
  { params }: { params: Promise<{ messageId: string }> }
) => {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    if (!userId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { messageId } = await params;
    const { reactionId } = await req.json();
    
    console.log("Infos", messageId, reactionId);

    if (!reactionId) return NextResponse.json({ message: "Reaction ID is required" }, { status: 400 });

    await prisma.reaction.deleteMany({
        where: {
            id: reactionId,
            messageId: messageId,
            userId: userId
        }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Error removing reaction" }, { status: 500 });
  }
};
