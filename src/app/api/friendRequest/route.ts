import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

interface FriendRequestBody {
  receiverId?: string;
  friendRequestId?: string;
  status?: "ACCEPTED" | "DECLINED";
  targetUserId?: string;
  requestId?: string;
}

// Send a friend request
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Fetch Logged in user from Supabase Authentication
    const { data: { user } } = await supabase.auth.getUser();
    const senderId = user?.id;
    
    // Receiver id from body
    const { receiverId }: FriendRequestBody = await request.json();
    
    if (!senderId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!receiverId) {
      return NextResponse.json({ error: "Receiver ID is required" }, { status: 400 });
    }

    // If requesting to itself
    if (senderId === receiverId) { 
      return NextResponse.json(
        { error: "You cannot send a friend request to yourself" },
        { status: 400 }
      );
    }
 
    // If already requested once
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

    // Insert into FriendRequest table
    const { data: friendRequest, error } = await supabase
      .from('FriendRequest')
      .insert({
        senderId,
        receiverId,
        status: "PENDING",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
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
export async function PUT(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    const { friendRequestId, status }: FriendRequestBody = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!friendRequestId) {
      return NextResponse.json({ error: "Friend request ID is required" }, { status: 400 });
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
      .update({ status, updatedAt: new Date().toISOString() })
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
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
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
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // First, fetch the friend requests
    const { data: friendRequests, error: requestError } = await supabase
      .from('FriendRequest')
      .select('*')
      .eq('receiverId', userId)
      .eq('status', 'PENDING');

    if (requestError) throw requestError;

    // If there are no friend requests, return empty array
    if (!friendRequests || friendRequests.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    // Extract sender IDs
    const senderIds = friendRequests.map(req => req.senderId);

    // Fetch sender information
    const { data: senders, error: senderError } = await supabase
      .from('User')
      .select('id, username, avatar')
      .in('id', senderIds);

    if (senderError) throw senderError;

    // Combine the data
    const enrichedRequests = friendRequests.map(request => ({
      ...request,
      sender: senders?.find(sender => sender.id === request.senderId) || null
    }));

    return NextResponse.json(enrichedRequests, { status: 200 });
  } catch (error) {
    console.error("Error fetching friend requests:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Cancel or Delete a friend request
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { targetUserId, requestId }: FriendRequestBody = await request.json();
    
    console.log("DELETE friend request - userId:", userId);
    console.log("DELETE friend request - targetUserId:", targetUserId);
    console.log("DELETE friend request - requestId:", requestId);

    // First, let's find the request to delete
    let findQuery = supabase.from('FriendRequest').select('*');
    
    if (requestId) {
      findQuery = findQuery.eq('id', requestId);
    } else if (targetUserId) {
      // Find any request between these two users
      findQuery = findQuery.or(`and(senderId.eq.${userId},receiverId.eq.${targetUserId}),and(senderId.eq.${targetUserId},receiverId.eq.${userId})`);
    } else {
      return NextResponse.json({ error: "Missing parameters: either requestId or targetUserId required" }, { status: 400 });
    }

    // Execute the find query
    const { data: foundRequests, error: findError } = await findQuery;
    
    // console.log("Found requests:", foundRequests);

    if (!foundRequests || foundRequests.length === 0) {
      return NextResponse.json(
        { error: "Friend request not found" },
        { status: 404 }
      );
    }

    const {data, error} = await supabase.from('FriendRequest').delete().eq('id', requestId);
    
    console.log("Deleted request:", data);
    console.log("Delete error:", error);
    
    return NextResponse.json(
        {message : "Friend request cancelled successfully"},
        {status : 200}
    );


  } catch (error) {
    console.error("Error in DELETE friend request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

