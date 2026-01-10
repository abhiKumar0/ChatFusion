import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export const DELETE = async (req: Request, {params}: {params: Promise<{messageId: string}>}) => {
    try {
        console.log("DELELELELETEEEE")
        const {messageId} = await params;
        const {searchParams} = new URL(req.url);
        const deleteType = searchParams.get("deleteType");
        const conversationId = searchParams.get("conversationId");
        const supabase = await  createClient();
        const {data: {user}} = await supabase.auth.getUser();

        if (deleteType === "ALL") {
            const {error} = await supabase.from("Message").delete().eq("id",messageId).eq   ("conversationId", conversationId).eq("senderId", user?.id);
            if (error) {
                console.log(error);
                return NextResponse.json({message: "Could not delete for All the message"}, {status: 500});
            }

        
        } else if (deleteType === "SELF") {
            const {error} = await supabase
                            .from("MessageVisibility")
                            .insert({
                                messageId,
                                userId: user?.id,
                            });
            if (error) {
                return NextResponse.json({message: "Could not delete for Self the message"}, {status: 500});
            }
        }         

        return NextResponse.json({message: "Message deleted successfully"}, {status: 200});
        
    } catch (error) {
        console.log("Error while deleting message", error);
        return NextResponse.json({message: "Could not delete the message"}, {status: 500});
    }
}