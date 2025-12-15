import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

// Send a friend request
export async function POST(request) {
  try {
    const supabase = await createClient();
    
    //Fetch Logged in user from Supabase Authentication
    const { data: { user } } = await supabase.auth.getUser();
    const senderId = user?.id;
    
    //Receiver id from body
    const { receiverId } = await request.json();
    
    if (!senderId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    //If requesting to itself
    if (senderId === receiverId) { 
      return NextResponse.json(
        { error: "You cannot send a friend request to yourself" },
        { status: 400 }
      );
    }
 
    //If already requested once
    const { data: existingRequest } = await supabase
      .from('FriendRequest')
      .select('*')
      .or(`and(senderId.eq.${senderId},receiverId.eq.${receiverId}),and(senderId.eq.${receiverId},receiverId.eq.${senderId})`)
      .single();

    if (existingRequest) {
      return NextResponse.json(
        { error: "Friend request already sent or you are already friends" },
        { status: 400 }
      );
    }

    //Insert into FriendRequest table
    const { data: friendRequest, error } = await supabase
      .from('FriendRequest')
      .insert({
        senderId,
        receiverId,
        status: "PENDING",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .select()
      .single();

    if (error) throw error;

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
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    const { friendRequestId, status } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: friendRequest } = await supabase
      .from('FriendRequest')
      .select('*')
      .eq('id', friendRequestId)
      .single();

    if (!friendRequest || friendRequest.receiverId !== userId) {
      return NextResponse.json(
        { error: "Friend request not found or you are not the receiver" },
        { status: 404 }
      );
    }

    if (status !== "ACCEPTED" && status !== "DECLINED") {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const { data: updatedRequest, error: updateError } = await supabase
      .from('FriendRequest')
      .update({ status, updatedAt: new Date() })
      .eq('id', friendRequestId)
      .select()
      .single();

    if (updateError) throw updateError;

    let conversation = null;
    if (status === "ACCEPTED") {
      // Create a new conversation for the one-to-one chat
      const { data: newChat, error: createError } = await supabase
        .from('Conversation')
        .insert({ 
          type: "ONE_TO_ONE",
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .select()
        .single();

      if (createError) throw createError;

      const { error: participantsError } = await supabase
        .from('ConversationParticipant')
        .insert([
          { userId: friendRequest.senderId, conversationId: newChat.id },
          { userId: friendRequest.receiverId, conversationId: newChat.id },
        ]);

      if (participantsError) throw participantsError;
      
      conversation = newChat;
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
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: friendRequests, error } = await supabase
    .from('FriendRequest')
    .select(`
      *,
      sender:User!FriendRequest_senderId_fkey(id, username, avatar) // ⬅️ FIX
    `)
    .eq('receiverId', userId)
    .eq('status', 'PENDING');

    if (error) throw error;

    return NextResponse.json(friendRequests, { status: 200 });
  } catch (error) {
    console.error("Error fetching friend requests:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Cancel or Delete a friend request
export async function DELETE(request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { targetUserId, requestId } = await request.json();

    let query = supabase.from('FriendRequest').delete();

    if (requestId) {
        query = query.eq('id', requestId);
    } else if (targetUserId) {
         // Find request between these two where current user is sender (Cancel) or receiver (Reject? No, just delete)
         // To be safe, ensure we only delete if we are part of it
         query = query.or(`and(senderId.eq.${userId},receiverId.eq.${targetUserId}),and(senderId.eq.${targetUserId},receiverId.eq.${userId})`);
    } else {
        return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const { error } = await query;

    if (error) throw error;

    return NextResponse.json({ message: "Request cancelled/deleted" }, { status: 200 });

  } catch (error) {
    console.error("Error deleting friend request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}