
import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import { transporter, mailOptions } from "@/lib/nodemailer";
import { getInviteTemplate } from "@/lib/email-templates";

export const POST = async (request: Request) => {
    try {
        const { email } = await request.json();

        // 1. Authenticate Sender
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        // 2. Get Sender Name
        const senderName = user.user_metadata?.full_name || "A friend";

        // 3. Send Email
        await transporter.sendMail({
            ...mailOptions,
            to: email,
            subject: `${senderName} invited you to ChatFusion`,
            html: getInviteTemplate(senderName)
        });

        return NextResponse.json({ message: "Invite sent successfully" });

    } catch (error) {
        console.error("Invite Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
