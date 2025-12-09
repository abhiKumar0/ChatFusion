import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export const GET = async (request: Request) => {
    try {
        const supabase = await createClient();
        
        const { data: { user: authUser } } = await supabase.auth.getUser();
        const userId = authUser?.id;

        if (!userId) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        console.log("Auth User",authUser)

        const { data: user, error } = await supabase
            .from('User')
            .select('*')
            .eq('email', authUser.email)
            .single();

        // console.log("User",user)

        if (error && error.code !== 'PGRST116') { // PGRST116 is the code for "The result contains 0 rows"
            return NextResponse.json({message: "User not found"}, { status: 404 });
        }

        if (!user) {
             // Fallback to auth user data if profile doesn't exist
             return NextResponse.json({
                user: {
                    id: authUser.id,
                    email: authUser.email,
                    // Add other necessary fields with defaults or from metadata
                    fullName: authUser.user_metadata?.full_name || authUser.email?.split('@')[0],
                    username: authUser.email?.split('@')[0],
                    avatar: "",
                    bio: "",
                    status: "OFFLINE"
                }
             }, { status: 200 });
        }

        const { password, ...userWithoutPassword } = user;

        return NextResponse.json({ user: userWithoutPassword }, { status: 200 });
    } catch {
        return NextResponse.json(
            { message: "Error while retrieving current user" },
            { status: 500 }
        );
    }
}