import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

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
        const { data: existingFriendship } = await supabase
            .from('Friendship')
            .select('*')
            .or(`and(senderId.eq.${user.id},receiverId.eq.${receiverId}),and(senderId.eq.${receiverId},receiverId.eq.${user.id})`)
            .single();

        if (existingFriendship) {
            return NextResponse.json({ error: "Friendship already exists or request already sent" }, { status: 400 });
        }

        // Create friend request
        const { data: friendship, error } = await supabase
            .from('Friendship')
            .insert({
                senderId: user.id,
                receiverId: receiverId,
                status: 'PENDING'
            })
            .select()
            .single();

        if (error) {
            console.error("Error creating friend request:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(friendship, { status: 201 });
    } catch (error) {
        console.error("Error in friend request API:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { targetUserId, requestId } = await request.json();

        if (!targetUserId && !requestId) {
            return NextResponse.json({ error: "Target user ID or request ID is required" }, { status: 400 });
        }

        let query = supabase.from('Friendship').delete();

        if (requestId) {
            // Delete by specific request ID
            query = query.eq('id', requestId);
        } else {
            // Delete by user IDs (either direction)
            query = query.or(`and(senderId.eq.${user.id},receiverId.eq.${targetUserId}),and(senderId.eq.${targetUserId},receiverId.eq.${user.id})`);
        }

        const { error } = await query;

        if (error) {
            console.error("Error deleting friend request:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ message: "Friend request cancelled successfully" }, { status: 200 });
    } catch (error) {
        console.error("Error in friend request delete API:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { requestId, action } = await request.json();

        if (!requestId || !action) {
            return NextResponse.json({ error: "Request ID and action are required" }, { status: 400 });
        }

        if (action === 'ACCEPT') {
            // Update the friendship status to ACCEPTED
            const { data: friendship, error } = await supabase
                .from('Friendship')
                .update({ status: 'ACCEPTED' })
                .eq('id', requestId)
                .eq('receiverId', user.id) // Only receiver can accept
                .select()
                .single();

            if (error) {
                console.error("Error accepting friend request:", error);
                return NextResponse.json({ error: error.message }, { status: 500 });
            }

            return NextResponse.json(friendship, { status: 200 });
        } else if (action === 'REJECT') {
            // Delete the friendship request
            const { error } = await supabase
                .from('Friendship')
                .delete()
                .eq('id', requestId)
                .eq('receiverId', user.id); // Only receiver can reject

            if (error) {
                console.error("Error rejecting friend request:", error);
                return NextResponse.json({ error: error.message }, { status: 500 });
            }

            return NextResponse.json({ message: "Friend request rejected" }, { status: 200 });
        } else {
            return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }
    } catch (error) {
        console.error("Error in friend request update API:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
