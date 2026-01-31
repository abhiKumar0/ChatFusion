import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

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

        if (!userId) {
            return NextResponse.json({ error: "User ID is required" }, { status: 400 });
        }

        // Get friend requests
        const { data: friendRequests, error } = await supabase
            .from('FriendRequest')
            .select(`*, sender:User!FriendRequest_senderId_fkey(*)`)
            .eq('receiverId', userId)
            .eq('status', 'PENDING')
            .order('createdAt', { ascending: false });

        if (error) {
            console.error("Error fetching friend requests:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

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
        const { data: existingFriendship } = await supabase
            .from('FriendRequest')
            .select('*')
            .or(`and(senderId.eq.${user.id},receiverId.eq.${receiverId}),and(senderId.eq.${receiverId},receiverId.eq.${user.id})`)
            .single();

        if (existingFriendship) {
            return NextResponse.json({ error: "Friendship already exists or request already sent" }, { status: 400 });
        }

        // Create friend request
        const { data: friendship, error } = await supabase
            .from('FriendRequest')
            .insert({
                senderId: user.id,
                receiverId: receiverId,
                status: 'PENDING',
                updatedAt: new Date(),
                createdAt: new Date(),
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
        // This prevents "ID guessing" attacks where users delete other people's requests.
        const { error } = await supabase
            .from('FriendRequest')
            .delete()
            .eq('id', requestId)
            .or(`senderId.eq.${userId},receiverId.eq.${userId}`);

        if (error) {
            console.error("Error deleting friend request:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // 3. Handle "Not Found" vs "Success"
        // Note: Supabase delete returns 204/200 even if 0 rows were deleted.
        // If you need to know if a row actually existed, add .select() before .delete()
        
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
        const { data: friendship, error } = await supabase
            .from('FriendRequest')
            .update({ status: 'ACCEPTED' })
            .eq('id', requestId)
            .eq('receiverId', user.id)
            .select()
            .single();

        if (error) {
            console.error("Error accepting friend request:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(friendship, { status: 200 });
        
    } catch (error) {
        console.error("Error in friend request update API:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
