import { NextResponse } from "next/server";
import otpGenerator from 'otp-generator';
import { transporter, mailOptions } from "@/lib/nodemailer";
import { getOtpEmailTemplate } from "@/lib/email-templates";
import { prisma } from "@/lib/prisma";

export const POST = async (request: Request) => {
    try {
        const { fullName, email } = await request.json();

        // 1. Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { email: email },
            select: { id: true }
        });

        if (existingUser) {
            return NextResponse.json({ message: "User already exists" }, { status: 400 });
        }

        // 2. Generate OTP
        const otp = otpGenerator.generate(6, {
            upperCaseAlphabets: false,
            specialChars: false,
            lowerCaseAlphabets: false
        });
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

        // 3. Store OTP in 'VerificationCodes'
        try {
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
        } catch (otpError: any) {
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