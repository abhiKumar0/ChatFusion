import { NextResponse } from "next/server";


export const GET = async (req: Request) => {
    return NextResponse.json({ message: "Backend is alive" }, { status: 200 });
}