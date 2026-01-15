
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import otpGenerator from 'otp-generator';
import { transporter, mailOptions } from "@/lib/nodemailer";
import { getOtpEmailTemplate } from "@/lib/email-templates";

export const POST = async (request: Request) => {
    try {
        const { fullName, email } = await request.json();

        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false,
                },
            }
        );

        // 1. Check if user exists
        const { data: existingUser } = await supabaseAdmin
            .from('User')
            .select('id')
            .eq('email', email)
            .single();

        if (existingUser) {
            return NextResponse.json({ message: "User already exists" }, { status: 400 });
        }

        // 2. Generate OTP
        const otp = otpGenerator.generate(6, {
            upperCaseAlphabets: false,
            specialChars: false,
            lowerCaseAlphabets: false
        });
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 mins

        // 3. Store OTP in 'VerificationCodes'
        const { error: otpError } = await supabaseAdmin
            .from('VerificationCodes')
            .upsert({
                email: email,
                code: otp,
                expiresAt: expiresAt
            }, { onConflict: 'email' });

        if (otpError) {
            console.error("OTP Store Error:", otpError);
            return NextResponse.json({ message: "Database Error: " + otpError.message }, { status: 500 });
        }

        // 4. Send Email via Nodemailer
        try {
            await transporter.sendMail({
                ...mailOptions,
                to: email,
                subject: 'Verify your email - ChatFusion',
                html: getOtpEmailTemplate(otp, fullName)
            });
            console.log("Email sent successfully");
        } catch (emailError: any) {
            console.error("Email Send Error:", emailError);
            return NextResponse.json({ message: "Failed to send email: " + emailError.message }, { status: 500 });
        }

        return NextResponse.json({ message: "OTP sent successfully" }, { status: 200 });

    } catch (error) {
        console.error("Signup Init Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}