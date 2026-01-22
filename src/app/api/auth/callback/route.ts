
import { encryptPrivateKey, generateUserKeys } from "@/lib/crypto";
import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get("next") ?? "/chat";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    //Profile data
    const { data: profile } = await supabase.auth.getUser();
    const {data: user} = await supabase.from('User').select('*').eq('id', profile?.user?.id).single();

    /*
      if user is not found in the database, create a new user
      Generate keys
      update public key in user table
      and add private key to user secrets table
    */
  //  console.log("Profidfdfle",profile.user?.email)
  //  console.log("User",user)

    if (!user) {
      if (!profile.user?.email) {
        return NextResponse.redirect(`${origin}/auth/auth-code-error`);
      }
      const {publicKey, privateKey} = await generateUserKeys();
      const encryptedPrivateKey = encryptPrivateKey(privateKey, profile.user.email);

      const { data:newUser, error:newUserError } = await supabase.rpc                ('create_user_with_secrets', {
        p_id: profile.user.id,
          p_email: profile.user.email,
          p_username: profile.user.email.split('@')[0],
          p_full_name: profile.user.user_metadata.full_name,
          p_avatar: profile.user.user_metadata.avatar_url,
          p_public_key: publicKey,
          p_private_key: encryptedPrivateKey
      });

      if (newUserError) {
        console.error("Error creating new user:", newUserError);
        return NextResponse.redirect(`${origin}/auth/auth-code-error`);
      }

    }
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
