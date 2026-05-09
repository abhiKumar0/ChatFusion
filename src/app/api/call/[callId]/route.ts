import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request, { params }: { params: Promise<{ callId: string }> }) {
  try {
    const supabase = await createClient();
    const { callId } = await params;
    const { status } = await request.json();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = await prisma.call.update({
        where: { id: callId },
        data: { status },
        include: {
            caller: true,
            receiver: true
        }
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error updating call status:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
