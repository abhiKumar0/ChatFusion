import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { username } = await request.json();

        if (!username) {
            return NextResponse.json({ message: "Username is required" }, { status: 400 });
        }

        const { data: user, error } = await supabase
            .from('User')
            .select('id')
            .eq('username', username)
            .single();

        if (error && error.code !== 'PGRST116') {
             console.error("Error checking username:", error);
             return NextResponse.json({ message: "Error checking username" }, { status: 500 });
        }

        if (user) {
            return NextResponse.json({ available: false }, { status: 200 });
        }

        return NextResponse.json({ available: true }, { status: 200 });

    } catch (error) {
        console.error("Error in check username route:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}
