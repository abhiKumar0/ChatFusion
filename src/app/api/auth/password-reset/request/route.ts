import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import otpGenerator from 'otp-generator';
import { transporter, mailOptions } from "@/lib/nodemailer";
import { getPasswordResetTemplate } from "@/lib/email-templates";
import { prisma } from "@/lib/prisma";

export const POST = async (request: Request) => {
    try {
        const { email } = await request.json();

        // 1. Check if user exists
        const user = await prisma.user.findUnique({
            where: { email: email },
            select: { fullName: true }
        });

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
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        // 3. Store OTP
        await prisma.verificationCodes.upsert({
            where: { email: email },
            update: {
                code: otp,
                expiresAt: expiresAt
            },
            create: {
                email: email,
                code: otp,
                expiresAt: expiresAt
            }
        });

        // 4. Send Email via Nodemailer
        try {
            await transporter.sendMail({
                ...mailOptions,
                to: email,
                subject: 'Reset your password - ChatFusion',
                html: getPasswordResetTemplate(otp, user.fullName || undefined)
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
