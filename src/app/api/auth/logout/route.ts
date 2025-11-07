import { NextResponse } from "next/server";
import { serialize } from "cookie";

export const GET = async (request: Request) => {
    try {
        const serializeCookie = serialize('authToken', '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 0,
            path: '/',
        });
        const response = NextResponse.json({ message: "Logged out successfully" }, { status: 200 });
        response.headers.set('Set-Cookie', serializeCookie);
        return response;
    } catch (error) {
        return NextResponse.json({ message: "Error while logging out" }, { status: 500 });
    }
}