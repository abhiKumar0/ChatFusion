
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import redis from "@/lib/redis";

export const POST = async (request: Request, { params }: { params: Promise<{ conversationsId: string }> }) => {
    try {
        const resolvedParams = await params;
        const conversationId = resolvedParams.conversationsId;
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        console.log(`[Mark Seen] User ${user.id} opening conversation ${conversationId}`);

        // Mark messages as seen (except your own messages)
        const { data, error } = await supabase
            .from('Message')
            .update({ status: 'seen' })
            .eq('conversationId', conversationId)
            .neq('senderId', user.id)
            .neq('status', 'seen')
            .select();

        console.log(`[Mark Seen] Updated ${data?.length || 0} messages to 'seen'`);

        if (error) {
            console.error("[Mark Seen] Error:", error);
            return NextResponse.json({ message: error.message }, { status: 500 });
        }


        await redis.hdel(`unread:${user.id}`, conversationId);

        // Notify other clients via broadcast
        if (data && data.length > 0) {
            console.log(`[Mark Seen] Broadcasting to channel chat:${conversationId}`);
            const channel = supabase.channel(`chat:${conversationId}`);

            // Subscribe first, then send
            await channel.subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await channel.send({
                        type: 'broadcast',
                        event: 'messages_seen',
                        payload: { conversationId, count: data.length }
                    });
                    console.log(`[Mark Seen] Broadcast sent!`);

                    // Unsubscribe after sending
                    await supabase.removeChannel(channel);
                }
            });
        }

        return NextResponse.json({ message: "Messages marked as seen", count: data?.length || 0 });
    } catch (error: any) {
        console.error("[Mark Seen] Exception:", error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
