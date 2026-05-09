import { encryptPrivateKey, generateUserKeys } from "@/lib/crypto";
import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
    
    if (!profile?.user?.id) {
        return NextResponse.redirect(`${origin}/auth/auth-code-error`);
    }

    const user = await prisma.user.findUnique({
        where: { id: profile.user.id }
    });

    if (!user) {
      if (!profile.user?.email) {
        return NextResponse.redirect(`${origin}/auth/auth-code-error`);
      }
      const {publicKey, privateKey} = await generateUserKeys();
      const encryptedPrivateKey = encryptPrivateKey(privateKey, profile.user.email);

      // Create user and secrets using a Prisma transaction
      try {
          await prisma.$transaction(async (tx) => {
              await tx.user.create({
                  data: {
                      id: profile.user!.id,
                      email: profile.user!.email!,
                      username: profile.user!.email!.split('@')[0],
                      fullName: profile.user!.user_metadata.full_name || profile.user!.email!.split('@')[0],
                      avatar: profile.user!.user_metadata.avatar_url,
                      password: 'oauth-managed',
                      publicKey: publicKey,
                      isOnline: false,
                  }
              });

              await tx.userSecrets.create({
                  data: {
                      userId: profile.user!.id,
                      encryptedPrivateKey: encryptedPrivateKey
                  }
              });
          });
      } catch (newUserError) {
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
