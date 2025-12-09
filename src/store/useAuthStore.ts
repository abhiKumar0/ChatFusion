import { create } from "zustand";
import { AuthStore } from "@/types/types";
import { createClient } from "@/lib/supabase";

const supabase = createClient();

export const useAuthStore = create<AuthStore>((set) => ({
    user: null,
    loading: false,
    error: null,
    login: async (email: string, password: string) => {
        set({ loading: true, error: null });
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;

            if (data.user) {
                // Fetch user profile
                const { data: profile } = await supabase
                    .from('User')
                    .select('*')
                    .eq('id', data.user.id)
                    .single();

                set({ user: profile || data.user as any, loading: false });
                window.location.href = "/";
                return true;
            }
            return false;
        } catch (error: any) {
            console.error("Login error:", error);
            set({ error: error.message || "Login failed", loading: false });
            return false;
        }
    },
    signup: async (email:string, password:string, fullName:string) => {
        set({ loading: true, error: null });
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                    }
                }
            });

            if (error) throw error;

            if (data.user) {
                // Create public profile
                // Note: Ensure RLS allows this, or use a trigger on the DB side
                const { error: profileError } = await supabase
                    .from('User')
                    .insert({
                        id: data.user.id,
                        email: email,
                        username: email.split('@')[0] + Math.floor(Math.random() * 1000),
                        fullName: fullName,
                        password: 'supa-auth-managed', // Placeholder
                        updatedAt: new Date().toISOString(),
                    });

                if (profileError) {
                    console.error("Profile creation failed:", profileError);
                }

                set({ user: data.user as any, loading: false });
                window.location.href = "/";
                return true;
            }
            return false;
        } catch (error: any) {
            console.error("Signup error:", error);
            set({ error: error.message || "Signup failed", loading: false });
            return false;
        }
    },
    getCurrentUser: async () => {
        set({ loading: true, error: null });
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                const { data: profile } = await supabase
                    .from('User')
                    .select('*')
                    .eq('id', user.id)
                    .single();
                
                set({ user: profile || user as any, loading: false });
            } else {
                set({ error: "No user session", loading: false });
            }
        } catch (error) {
            console.error("Get Current User error:", error);
            set({ error: "Failed to retrieve user", loading: false });
        }
    },
}));