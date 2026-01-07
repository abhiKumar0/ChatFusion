import { createClient } from "@supabase/supabase-js"; // Import directly
import { NextResponse } from "next/server";

export const POST = async (request: Request) => {
    try {
        const { fullName, email, password, publicKey, encryptPrivateKey } = await request.json();

        // 👇 THIS IS THE FIX.
        // We create a specific client JUST for this request using the SERVICE_ROLE_KEY
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!, // ⚠️ Must be in .env.local
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false,
                },
            }
        );

        // 1. Sign up the user (using Admin method ensures we don't need a session)
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: email.trim(),
            password: password,
            email_confirm: true,
            user_metadata: { full_name: fullName }
        });

        if (authError) return NextResponse.json({ message: authError.message }, { status: 400 });

        if (authData.user) {
            // 2. Insert into 'User' table
            // Because 'supabaseAdmin' uses the SERVICE_ROLE_KEY, it BYPASSES RLS.
            // The 42501 error will disappear.
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

            const {error: keyError} = await supabaseAdmin
                .from('UserSecrets')
                .insert({
                    id: authData.user.id,
                    encryptedPrivateKey: encryptPrivateKey,
                });

            if (keyError) {
                console.log("Key error", keyError);
                // Clean up the auth user if profile creation fails
                await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
                return NextResponse.json({ message: "Key creation failed: " + keyError.message }, { status: 500 });
            }

            if (profileError) {
                console.error("Profile Error:", profileError);
                // Clean up the auth user if profile creation fails
                await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
                return NextResponse.json({ message: "Profile creation failed: " + profileError.message }, { status: 500 });
            }
        }

        return NextResponse.json({ user: authData.user }, { status: 201 });

    } catch (error) {
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}