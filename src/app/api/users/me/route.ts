import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const GET = async (request: Request) => {
    try {
        const supabase = await createClient();
        
        const { data: { user: authUser } } = await supabase.auth.getUser();
        const userId = authUser?.id;

        if (!userId || !authUser?.email) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: authUser.email }
        });

        if (!user) {
            return NextResponse.json({message: "User not found"}, { status: 404 });
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
        const { fullName, bio, avatar, username } = body;

        // Construct update object with only defined fields
        const updates: any = {};
        if (fullName !== undefined) updates.fullName = fullName;
        if (avatar !== undefined) updates.avatar = avatar;
        
        if (username) {
             const existingUser = await prisma.user.findUnique({
                 where: { username: username }
             });
            
            if (existingUser && existingUser.id !== userId) {
                return NextResponse.json({ message: "Username already taken" }, { status: 400 });
            }
            updates.username = username;
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updates
        });

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