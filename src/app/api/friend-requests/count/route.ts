import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const count = await prisma.friendRequest.count({
    where: {
      receiverId: userId,
      status: "PENDING",
    },
  });

  return NextResponse.json({ count });
}
