import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

// Update a message (only by its sender)
export const PATCH = async (
  req: Request,
  { params }: { params: Promise<{ conversationsId: string; messageId: string }> }
) => {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

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
    const { data: message } = await supabase
        .from('Message')
        .select('id')
        .eq('id', messageId)
        .eq('conversationId', conversationsId)
        .eq('senderId', userId)
        .single();

    if (!message) {
      return NextResponse.json({ message: "Message not found" }, { status: 404 });
    }

    const { data: updated, error } = await supabase
      .from('Message')
      .update({ content, nonce, updatedAt: new Date().toISOString() })
      .eq('id', messageId)
      .select(`
        *,
        sender:User(*),
        reactions:Reaction(
          *,
          user:User(id, fullName, username)
        )
      `)
      .single();

    if (error) throw error;

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
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    if (!userId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { conversationsId, messageId } = await params;

    // Ensure message exists in conversation and user is the sender
    const { data: message } = await supabase
        .from('Message')
        .select('id')
        .eq('id', messageId)
        .eq('conversationId', conversationsId)
        .eq('senderId', userId)
        .single();

    if (!message) {
      return NextResponse.json({ message: "Message not found" }, { status: 404 });
    }

    const { error } = await supabase
      .from('Message')
      .delete()
      .eq('id', messageId);

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Error deleting message" }, { status: 500 });
  }
};


