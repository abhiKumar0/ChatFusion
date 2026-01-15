
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const POST = async (request: Request) => {
    try {
        const { fullName, email, password, publicKey, encryptPrivateKey, otp } = await request.json();

        if (!otp) {
            return NextResponse.json({ message: "OTP is required" }, { status: 400 });
        }

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

        // 1. Verify OTP
        const { data: verificationData, error: verificationError } = await supabaseAdmin
            .from('VerificationCodes')
            .select('*')
            .eq('email', email)
            .eq('code', otp)
            .single();

        if (verificationError || !verificationData) {
            return NextResponse.json({ message: "Invalid verification code" }, { status: 400 });
        }

        // Check verificationData.expiresAt
        // Note: User seems to have configured DB column as 'expiresAt'
        if (new Date(verificationData.expiresAt) < new Date()) {
            return NextResponse.json({ message: "Verification code expired" }, { status: 400 });
        }

        // 2. Sign up the user (using Admin method)
        // Note: passing 'email_confirm: true' since we just verified it via OTP
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: email.trim(),
            password: password,
            email_confirm: true,
            user_metadata: { full_name: fullName }
        });

        if (authError) return NextResponse.json({ message: authError.message }, { status: 400 });

        if (authData.user) {
            // 3. Insert into 'User' table
            const { error: profileError } = await supabaseAdmin
                .from('User')
                .insert({
                    id: authData.user.id,
                    email: email,
                    username: email.split('@')[0] + Math.floor(Math.random() * 1000),
                    fullName: fullName,
                    password: 'supa-auth-managed',
                    publicKey: publicKey,
                    updatedAt: new Date().toISOString(),
                    createdAt: new Date().toISOString(),
                    isOnline: false,
                });

            if (profileError) {
                console.log("Profile error", profileError);
                await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
                return NextResponse.json({ message: "Profile creation failed: " + profileError.message }, { status: 500 });
            }

            // 4. Insert Secrets
            const { error: keyError } = await supabaseAdmin
                .from('UserSecrets')
                .insert({
                    userId: authData.user.id,
                    encryptedPrivateKey: encryptPrivateKey,
                });

            if (keyError) {
                console.log("Key error", keyError);
                await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
                return NextResponse.json({ message: "Key creation failed: " + keyError.message }, { status: 500 });
            }

            // 5. Delete OTP
            await supabaseAdmin.from('VerificationCodes').delete().eq('email', email);
        }

        return NextResponse.json({ user: authData.user }, { status: 201 });

    } catch (error) {
        console.error("Verification Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
