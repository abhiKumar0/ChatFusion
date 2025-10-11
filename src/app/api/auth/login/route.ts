import { prisma } from "@/lib/prisma";
import * as bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { serialize } from "cookie";

const secret = process.env.JWT_SECRET;
const cookieName = "authToken";

export const POST = async (request: Request) => {
  try {
    const body = await request.json();

    const { email, password } = await body;
console.log(email, password);
    //input check
    if (!email || !password) {
      return NextResponse.json({ message: "Missing fields" }, { status: 400 });
    }

    //Checking user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 }
      );
    }

    const tokenPayload = {
      userId: user.id,
      username: user.username,
      email: user.email,
    };

    const token = jwt.sign(tokenPayload, secret!, { expiresIn: "1d" });

    const serializeCookie = serialize(cookieName, token, {
      httpOnly: true, // Prevents client-side JS from accessing the cookie
      secure: process.env.NODE_ENV === "production", // Use secure cookies in production
      sameSite: "strict", // Strictly same-site policy
      maxAge: 60 * 60 * 24 * 7, // 1 week in seconds
      path: "/", // The cookie is available for all paths
    });

    const { ...userWithoutPassword } = user;
    const response = NextResponse.json({ user: userWithoutPassword, token }, { status: 200 });

    response.headers.set("Set-Cookie", serializeCookie);

    
    return response;
  } catch (error) {
    return NextResponse.json(
      { message: "Error occurred while logging in"+error },
      { status: 500 }
    );
  }
};
