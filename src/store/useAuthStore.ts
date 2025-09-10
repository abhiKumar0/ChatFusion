import { create } from "zustand";
import { User, AuthStore } from "@/types/types";
import axios from "axios";
import { useEffect } from "react";

export const useAuthStore = create<AuthStore> ((set) => ({
    user: null,
    loading: false,
    error: null,
    login: async (email: string, password: string) => {
        set({ loading: true, error: null });
        try {
            //API call
            const response = await axios.post(`/api/auth/login`,{email, password});

            console.log("Login response:", response.data);  
            
            //Retrieve data
            const {data} = response.data;

            //Update user if valid
            if (data) {
                set({ user: data.user, loading: false });
                window.location.href = "/";
                return true;
            } else {
                set({ error: "Login failed", loading: false });
                return false;
            }
        } catch (error) {
            console.error("Login error:", error);
            set({ error: "Login failed", loading: false });
            return false;
        }
    },
    signup: async (email:string, password:string, fullName:string) => {
        set({ loading: true, error: null });
        try {
            //API call
            const response = await axios.post(`/api/auth/signup`, { email, password, fullName });

            console.log("Signup response:", response.data);

            //Retrieve data
            const { data } = response.data;

            //Update user if valid
            if (data) {
                set({ user: data.user, loading: false });
                window.location.href = "/";
                return true;
            } else {
                set({ error: "Signup failed", loading: false });
                return false;
            }
        } catch (error) {
            console.error("Signup error:", error);
            set({ error: "Signup failed", loading: false });
            return false;
        }
    },
    getCurrentUser: async () => {
        set({ loading: true, error: null });
        try {
            const response = await axios.get(`/api/users/me`, {
                withCredentials: true
            });

            const { user } = response.data;

            if (user) {
                set({ user, loading: false });
            } else {
                set({ error: "Failed to retrieve user", loading: false });
            }
        } catch (error) {
            console.error("Get Current User error:", error);
            set({ error: "Failed to retrieve user", loading: false });
        }
    },
}));