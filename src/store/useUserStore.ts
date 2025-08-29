import { UserStore } from "@/types/types";
import axios from "axios";
import { create } from "zustand";



export const useUserStore = create<UserStore>((set) => ({
    users: null,
    loading: false,
    error: null,
    fetchUsers: async () => {
        set({ loading: true });
        try {
            const response = await axios.get(`/api/users`, {withCredentials: true});
            console.log("Fetch Users Response:", response);
            if (response.status === 200) {
                set({ users: response.data.users });
            }
        } catch (error) {
            set({ error: "Error Fetching Users" });
        } finally {
            set({ loading: false });
        }
    },
    getUserById: async (id: string) => {
        set({ loading: true });
        try {
            const response = await axios.get(`/api/users/${id}`);
            return response.data;
        } catch (error) {
            set({ error: "Could not get user!" });
            return null;
        } finally {
            set({ loading: false });
        }
    }
}))