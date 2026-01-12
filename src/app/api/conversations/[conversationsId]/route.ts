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
                    user:User(id, email, username, fullName, avatar, publicKey)
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
        const {conversationsId} = await params;
        const {searchParams} = new URL(req.url);
        const deleteFor = searchParams.get("deleteFor");
        
        //user
        const {data: {user}} = await supabase.auth.getUser();
        const userId = user?.id;

        if (!userId) {
            return NextResponse.json({message: "Unauthorized"}, {status: 401});
        }

        if (deleteFor === "ALL") {
            const {error, count} = await supabase
                            .from("Conversation")
                            .delete()
                            .eq("id", conversationsId);
            
            if (error) {
                return NextResponse.json({message: error.message}, {status: 400});
            }
            
            if (count == 0 && !error) {
                return NextResponse.json({message: "Forbidden Action not Allowed"}, {status: 403});
            }
        } else {
            const {error} = await supabase
                            .from("ConversationParticipant")
                            .update({
                                lastDeletedAt: new Date().toISOString()
                            })
                            .eq("conversationId", conversationsId)
                            .eq("userId", userId);
            if (error) {
                return NextResponse.json({message: error.message}, {status: 403});
            }
        }

        return NextResponse.json({message: "Conversation deleted"}, {status: 201});
    } catch (err) {
        console.log(err);
        return NextResponse.json({message: "Error while deleting conversation"}, {status: 500});
    }
}