import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export const GET = async () => {
    try {
        const supabase = await createClient();
        const { data: users, error } = await supabase
            .from('User')
            .select('*');

        if (error) {
            return NextResponse.json({message: "Users not found"}, { status: 404 });
        }

        return NextResponse.json({ users }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: "Error occurred while fetching users" + error }, { status: 500 });
    }
}