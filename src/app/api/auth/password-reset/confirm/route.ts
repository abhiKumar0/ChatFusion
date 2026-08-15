import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const POST = async (request: Request) => {
    try {
        const { email, otp, newPassword } = await request.json();

        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { auth: { autoRefreshToken: false, persistSession: false } }
        );

        // 1. Verify OTP
        const verificationData = await prisma.verificationCodes.findFirst({
            where: {
                email: email,
                code: otp
            }
        });

        if (!verificationData) {
            return NextResponse.json({ message: "Invalid or expired verification code" }, { status: 400 });
        }

        if (new Date(verificationData.expiresAt) < new Date()) {
            return NextResponse.json({ message: "Verification code expired" }, { status: 400 });
        }

        // 2. Find Auth User ID
        const userProfile = await prisma.user.findUnique({
            where: { email: email },
            select: { id: true }
        });

        if (!userProfile) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        // 3. Update Password
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            userProfile.id,
            { password: newPassword }
        );

        if (updateError) {
            return NextResponse.json({ message: "Failed to update password" }, { status: 500 });
        }

        // 4. Delete OTP
        await prisma.verificationCodes.deleteMany({
            where: { email: email }
        });

        return NextResponse.json({ message: "Password updated successfully" });

    } catch (error) {
        console.error("Password Update Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
