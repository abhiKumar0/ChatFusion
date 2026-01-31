import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";


export const DELETE = async (request: Request, {params}: {params: Promise<{friendId: string}>}) => {
    try {

        const supabase = await createClient();
        const {data: { user }} = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({message: "Unauthorized"}, {status: 403});
        }
        const userId = user.id;
        const {friendId} = await params;
        if (!friendId) {
            return NextResponse.json({message: "Friend Id is required"});
        }

        const { data: reqData, error } = await supabase
        .from("FriendRequest")
        .select("*")
        .or(`and(senderId.eq.${userId},receiverId.eq.${friendId}),and(senderId.eq.${friendId},receiverId.eq.${userId})`)
        .single();

        if (!reqData) {
            return NextResponse.json({message: "No Conenction exist"}, {status: 404});
        }

        const  {error: unfriendError} = await supabase
            .from("FriendRequest")
            .delete()
            .eq("id", reqData.id);
        
        if (unfriendError) {
            return NextResponse.json({message: unfriendError.message}, {status: 400})
        }

        return NextResponse.json({message: "Unfriended Successfully"}, {status: 200});

    } catch(err) {
        console.log("Remove Friend Error:",err);
        return NextResponse.json({error: err}, {status: 500})
    }
} 