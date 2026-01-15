
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const POST = async (request: Request) => {
    try {
        const { email, otp, newPassword } = await request.json();

        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { auth: { autoRefreshToken: false, persistSession: false } }
        );

        // 1. Verify OTP
        const { data: verificationData, error: verificationError } = await supabaseAdmin
            .from('VerificationCodes')
            .select('*')
            .eq('email', email)
            .eq('code', otp)
            .single();

        if (verificationError || !verificationData) {
            return NextResponse.json({ message: "Invalid or expired verification code" }, { status: 400 });
        }

        if (new Date(verificationData.expiresAt) < new Date()) {
            return NextResponse.json({ message: "Verification code expired" }, { status: 400 });
        }

        // 2. Find Auth User ID
        // We need the Auth ID to update the password.
        // We can get it from the 'User' table if we store it there (id is same as auth.id)
        const { data: userProfile } = await supabaseAdmin
            .from('User')
            .select('id')
            .eq('email', email)
            .single();

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
        await supabaseAdmin.from('VerificationCodes').delete().eq('email', email);

        return NextResponse.json({ message: "Password updated successfully" });

    } catch (error) {
        console.error("Password Update Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
