import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
    try {
        const { username } = await request.json();

        if (!username) {
            return NextResponse.json({ message: "Username is required" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { username: username },
            select: { id: true }
        });

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
