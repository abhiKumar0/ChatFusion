import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request, { params }: { params: Promise<{ callId: string }> }) {
  try {
    const supabase = await createClient();
    const { callId } = await params;
    const { answerSdp } = await request.json();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = await prisma.call.update({
        where: { id: callId },
        data: { answerSdp: answerSdp, status: 'CONNECTED' },
        include: {
            caller: true,
            receiver: true
        }
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error answering call:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
