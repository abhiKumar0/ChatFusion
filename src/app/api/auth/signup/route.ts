import { prisma } from "@/lib/prisma";
import * as bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { serialize } from "cookie";

const secret = process.env.JWT_SECRET;
const cookieName = "authToken";

export const POST = async (request: Request) => {
  try {
    //body from request
    const body = request.json();

    const { email, password, fullName, publicKey, encryptPrivateKey } = await body;
    

    if (!email || !password || !fullName) {
      return NextResponse.json({ message: "Missing fields" }, { status: 400 });
    }

    //Check if user is already exist
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "User already exist" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const username = email.split("@")[0];

    const user = await prisma.user.create({
      data: {
        email,
        fullName,
        password: hashedPassword,
        username,
        publicKey,
        encryptedPrivateKey: encryptPrivateKey,
      },
    });

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

    const { password: _, ...userWithoutPassword } = user;
    const response = NextResponse.json({ user: userWithoutPassword, token }, { status: 201 });

    response.headers.set("Set-Cookie", serializeCookie);

    return response;
  } catch (error) {
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
};
