import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export const GET = async (request: Request) => {
    try {
        const supabase = await createClient();
        const { error } = await supabase.auth.signOut();

        if (error) {
            return NextResponse.json({ message: error.message }, { status: 500 });
        }

        return NextResponse.json({ message: "Logged out successfully" }, { status: 200 });
    } catch (error) {
        console.error("Logout error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
