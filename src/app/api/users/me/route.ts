import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";



export const GET = async (request: Request) => {
    try {
        const userId = request.headers.get('x-user-id');
        console.log(request)
        if (!userId) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId }
            
        })

        if (!user) {
            return NextResponse.json({message: "User not found"}, { status: 404 });
        }

        const { ...userWithoutPassword } = user;

        return NextResponse.json({ user: userWithoutPassword }, { status: 200 });
    } catch {
        return NextResponse.json(
            { message: "Error while retrieving current user" },
            { status: 500 }
        );
    }
}