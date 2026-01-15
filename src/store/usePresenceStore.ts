import { create } from 'zustand';

interface PresenceStore {
    onlineUsers: Set<string>;
    setOnlineUsers: (users: string[]) => void;
    syncOnlineUsers: (presenceState: Record<string, any[]>) => void;
}

export const usePresenceStore = create<PresenceStore>((set) => ({
    onlineUsers: new Set(),
    setOnlineUsers: (users) => set({ onlineUsers: new Set(users) }),
    syncOnlineUsers: (presenceState) => {
        const online = new Set<string>();
        Object.values(presenceState).forEach((presences) => {
            presences.forEach((p) => {
                if (p.user_id) {
                    online.add(p.user_id);
                }
            });
        });
        set({ onlineUsers: online });
    }
}));
