
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import otpGenerator from 'otp-generator';
import { transporter, mailOptions } from "@/lib/nodemailer";
import { getPasswordResetTemplate } from "@/lib/email-templates";

export const POST = async (request: Request) => {
    try {
        const { email } = await request.json();

        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { auth: { autoRefreshToken: false, persistSession: false } }
        );

        // 1. Check if user exists
        const { data: user } = await supabaseAdmin
            .from('User')
            .select('fullName')
            .eq('email', email)
            .single();

        if (!user) {
            // Return 200 even if user doesn't exist to prevent enumeration
            return NextResponse.json({ message: "If an account exists, a code has been sent." });
        }

        // 2. Generate OTP
        const otp = otpGenerator.generate(6, {
            upperCaseAlphabets: false,
            specialChars: false,
            lowerCaseAlphabets: false
        });
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

        // 3. Store OTP
        // Ensure column name matches DB (expiresAt per user change)
        await supabaseAdmin
            .from('VerificationCodes')
            .upsert({ email, code: otp, expiresAt: expiresAt }, { onConflict: 'email' });

        // 4. Send Email via Nodemailer
        try {
            await transporter.sendMail({
                ...mailOptions,
                to: email,
                subject: 'Reset your password - ChatFusion',
                html: getPasswordResetTemplate(otp, user.fullName)
            });
            console.log("Password reset email sent");
        } catch (emailError: any) {
            console.error("Email Send Error:", emailError);
            // We still return 200 to user, but log the error
        }

        return NextResponse.json({ message: "If an account exists, a code has been sent." });

    } catch (error) {
        console.error("Password Reset Request Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
