import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET(req: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const { count, error } = await supabase
    .from('FriendRequest')
    .select('*', { count: 'exact', head: true })
    .eq('receiverId', userId)
    .eq('status', 'PENDING');

  if (error) {
    return NextResponse.json({ error: "Error fetching count" }, { status: 500 });
  }

  return NextResponse.json({ count });
}
