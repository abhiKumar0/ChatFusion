import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";


export async function POST(req: Request) {
  const { senderId, receiverId } = await req.json();

  const friendRequest = await prisma.friendRequest.create({
    data: {
      senderId,
      receiverId,
    },
  });



  return NextResponse.json(friendRequest);
}
