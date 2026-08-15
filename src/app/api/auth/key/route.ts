import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";

export const GET = async (request: Request) => {
    try {
        const supabase = await createClient();
        
       const { data: { user: authUser } } = await supabase.auth.getUser();

       if (!authUser) {
        return NextResponse.json({ error: "User Not Found" }, { status: 404 });
       }

       const userId = authUser.id;

       const userSecret = await prisma.userSecrets.findUnique({
           where: { userId: userId }
       });
        
        if (!userSecret) {
            return NextResponse.json({message: "Error Retieving Private Key"}, {status: 500});
        }

        return NextResponse.json({userSecret}, {status: 200});       
       
    } catch (error) {
        console.log("Error During Retieving Private Key", error);
        
        return NextResponse.json({ error: "Error During Retieving Private Key" }, { status: 500 });
    }
}