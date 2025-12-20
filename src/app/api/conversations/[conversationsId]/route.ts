import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export const GET = async (req: Request, {params} : {params: Promise<{conversationsId: string}>}) => {
    try {
        const supabase = await createClient();
        const resolvedParams = await params;
        const convoId = resolvedParams.conversationsId;

        const { data: conversation, error } = await supabase
            .from('Conversation')
            .select(`
                *,
                participants:ConversationParticipant(
                    *,
                    user:User(id, email, username, fullName, avatar, publicKey, encryptedPrivateKey)
                )
            `)
            .eq('id', convoId)
            .single();

        if (error || !conversation) {
            return NextResponse.json({message: "Conversation doesn't exist"}, {status: 404});
        }

        return NextResponse.json({conversation, message: "Conversation Fetched"}, {status: 201});
    } catch (error) {
        console.log(error);
        return NextResponse.json({message: "Error while fetching conversation"}, {status: 500});
    }
}


export const DELETE = async (req: Request, {params}: {params: Promise<{conversationsId: string}>}) => {
    try {
        //Aquiring supabase
        const supabase = await createClient();
        const resolvedParams = await params;
        const convoId = resolvedParams.conversationsId;

        const {data: conversation, error: conversationError} = await supabase
            .from("Conversation")
            .select("*")
            .eq("id", convoId)
            .single();

        if (conversationError || !conversation) {
            return NextResponse.json({message: "Conversation doesn't exist"}, {status: 404});
        }
        console.log(conversation);

        const {data, error} = await supabase
            .from("Conversation")
            .delete()
            .eq("id", convoId);

        if (error) {
            return NextResponse.json({message: "Error while deleting conversation"}, {status: 500});
        }

        return NextResponse.json({message: "Conversation deleted"}, {status: 201});
    } catch (err) {
        console.log(err);
        return NextResponse.json({message: "Error while deleting conversation"}, {status: 500});
    }
}