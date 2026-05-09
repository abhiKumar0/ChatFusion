import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const GET = async () => {
    try {
        const supabase = await createClient();
        const { data: { user: authUser } } = await supabase.auth.getUser();
        const currentUserId = authUser?.id;

        // Fetch all users
        const users = await prisma.user.findMany({
            where: currentUserId ? {
                id: { not: currentUserId }
            } : undefined
        });

        if (!users) {
            return NextResponse.json({message: "Users not found"}, { status: 404 });
        }

        let usersWithStatus = users as any[];

        if (currentUserId && users.length > 0) {
            // Fetch friend requests involving the current user
            const requests = await prisma.friendRequest.findMany({
                where: {
                    OR: [
                        { senderId: currentUserId },
                        { receiverId: currentUserId }
                    ]
                }
            });
            
            usersWithStatus = users.map((user) => {
                const request = requests.find(
                    (r) => 
                        (r.senderId === currentUserId && r.receiverId === user.id) || 
                        (r.receiverId === currentUserId && r.senderId === user.id)
                );

                let status = 'NONE';
                let friendshipId = null;

                if (request) {
                    friendshipId = request.id;
                    if (request.status === 'ACCEPTED') {
                        status = 'FRIEND';
                    } else if (request.status === 'PENDING') {
                        if (request.senderId === currentUserId) {
                            status = 'REQUEST_SENT';
                        } else {
                            status = 'REQUEST_RECEIVED';
                        }
                    }
                }

                return { ...user, friendshipStatus: status, friendshipId };
            });
        }

        return NextResponse.json({ users: usersWithStatus }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: "Error occurred while fetching users" + error }, { status: 500 });
    }
}