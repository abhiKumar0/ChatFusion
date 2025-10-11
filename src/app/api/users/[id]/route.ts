import { prisma } from "@/lib/prisma";


export const GET = async(req: Request, { params }: { params: { id: string } }) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: params.id }
        });
        if (!user) {
            return new Response("User not found", { status: 404 });
        }
        return new Response(JSON.stringify(user), { status: 200 });
    } catch {
        return new Response("Error fetching user", { status: 500 });
    }
}