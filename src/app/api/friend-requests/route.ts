import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getIO } from "@/lib/socket-server";

export async function POST(req: Request) {
  const { senderId, receiverId } = await req.json();

  const friendRequest = await prisma.friendRequest.create({
    data: {
      senderId,
      receiverId,
    },
  });

  try {
    const io = getIO();
    io.to(receiverId).emit("notification", friendRequest);
  } catch {}

  return NextResponse.json(friendRequest);
}
