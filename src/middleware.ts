// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose"; // A modern, edge-compatible JWT library
import { prisma } from "./lib/prisma";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);
const COOKIE_NAME = "authToken";

export async function middleware(request: NextRequest) {
  // 1. Get the cookie from the request
  const token =
    request.cookies.get(COOKIE_NAME)?.value ||
    request.headers.get("authorization")?.replace("Bearer ", "");

  // 2. If no token, redirect to login
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  // 3. Verify the token
  try {
    // Verify the JWT
    const { payload } = await jwtVerify(token, JWT_SECRET);

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-id", payload.userId as string);
    requestHeaders.set("x-user-email", payload.email as string);
    requestHeaders.set("x-user-username", payload.username as string);

    // Pass the request on with the new headers
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    // If token is invalid or expired, redirect to login
    console.error("JWT Verification Error:", error);
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

// 4. Configure which routes the middleware runs on
export const config = {
  matcher: [
    "/api/users/:path*",
  ],
};
