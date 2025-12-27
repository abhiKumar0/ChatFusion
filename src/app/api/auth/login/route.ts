import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export const POST = async (request: Request) => {
    try {
        const supabase = await createClient();
        const { email, password } = await request.json();

        const {data: existingUser, error: existingUserError} = await supabase
            .from('User')
            .select('*')
            .eq('email', email)
            .single();

        if (existingUserError) {
            return NextResponse.json({ message: "User with email does not exist. Please Sign up First." }, { status: 401 });
        }

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            return NextResponse.json({ message: "Incorrect Password." }, { status: 401 });
        }
        
        // console.log(data);

        // Fetch user profile to return consistent data structure
        const { data: profile } = await supabase
            .from('User')
            .select('*')
            .eq('id', data.user.id)
            .single();

        // console.log("profile", profile)

        return NextResponse.json({ 
            user: profile || data.user,
            session: data.session 
        }, { status: 200 });

    } catch (error) {
        console.error("Login error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
