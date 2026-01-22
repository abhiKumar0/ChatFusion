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
             // Create user if they don't exist in public table
             console.log("User not found, creating...")
             const newUser = {
                id: authUser.id,
                email: authUser.email,
                fullName: authUser.user_metadata?.full_name || authUser.email?.split('@')[0],
                username: (authUser.email?.split('@')[0] || 'user') + Math.floor(Math.random() * 10000),
                avatar: authUser.user_metadata?.avatar_url || "",
                isOnline: true,
                updatedAt: new Date().toISOString(),
             };

             const { data: createdUser, error: createError } = await supabase
                .from('User')
                .insert(newUser)
                .select()
                .single();

             if (createError) {
                 console.error("Error creating user:", createError);
                 // Fallback to ephemeral data if insertion fails
                 return NextResponse.json({
                    user: newUser
                 }, { status: 200 });
             }
             
             return NextResponse.json({ user: createdUser }, { status: 200 });
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

export const PUT = async (request: Request) => {
    try {
        const supabase = await createClient();
        const { data: { user: authUser } } = await supabase.auth.getUser();
        const userId = authUser?.id;

        if (!userId) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { fullName, bio, avatar } = body;

        // Construct update object with only defined fields
        const updates: any = {};
        if (fullName !== undefined) updates.fullName = fullName;
        if (fullName !== undefined) updates.fullName = fullName;
        // if (bio !== undefined) updates.bio = bio; // Bio update removed per request

        if (avatar !== undefined) updates.avatar = avatar;

        
        if (body.username) {
             const { data: existingUser } = await supabase
                .from('User')
                .select('id')
                .eq('username', body.username)
                .neq('id', userId) 
                .single();
            
            if (existingUser) {
                return NextResponse.json({ message: "Username already taken" }, { status: 400 });
            }
            updates.username = body.username;
        }

        updates.updatedAt = new Date();


        const { data: updatedUser, error } = await supabase
            .from('User')
            .update(updates)
            .eq('id', userId)
            .select()
            .single();

        if (error) {
            console.error("Error updating user:", error);
            return NextResponse.json({ message: "Error updating user" }, { status: 500 });
        }

        const { password, ...userWithoutPassword } = updatedUser;

        return NextResponse.json({ user: userWithoutPassword }, { status: 200 });

    } catch (error) {
        console.error("Error in update user route:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}