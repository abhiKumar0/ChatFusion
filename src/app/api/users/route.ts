import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const GET = async (req: Request) => {
    try {
        const users = await prisma.user.findMany();

        if (!users) {
            return NextResponse.json({message: "Users not found"}, { status: 404 });
        }

        return NextResponse.json({ users }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: "Error occurred while fetching users" + error }, { status: 500 });
    }
}