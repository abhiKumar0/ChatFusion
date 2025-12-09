import { createClient } from "@/lib/supabase-server";

export const GET = async(req: Request, { params }: { params: Promise<{ id: string }> }) => {
    try {
        const supabase = await createClient();
        const resolvedParams = await params;
        
        const { data: user, error } = await supabase
            .from('User')
            .select('*')
            .eq('id', resolvedParams.id)
            .single();

        if (error || !user) {
            return new Response("User not found", { status: 404 });
        }
        return new Response(JSON.stringify(user), { status: 200 });
    } catch {
        return new Response("Error fetching user", { status: 500 });
    }
}