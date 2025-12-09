import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

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
    const { data: message } = await supabase
        .from('Message')
        .select('id')
        .eq('id', messageId)
        .eq('conversationId', conversationId)
        .single();

    if (!message) return NextResponse.json({ message: "Message not found" }, { status: 404 });
    

    const { data: reaction, error } = await supabase
      .from('Reaction')
      .upsert({ userId, messageId, emoji, createdAt: new Date(), updatedAt: new Date() }, { onConflict: 'userId, messageId, emoji' })
      .select(`
        *,
        user:User(id, fullName, username)
      `)
      .single();

    if (error) throw error;

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

    const { error } = await supabase
      .from('Reaction')
      .delete()
      .match({ userId, messageId, id:reactionId });

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Error removing reaction" }, { status: 500 });
  }
};


