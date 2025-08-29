export interface User {
    id: string,
    email: string,
    username: string,
    name: string,
    avatar: string
}

export interface AuthStore {
    user: User | null;
    loading: boolean;
    error: string | null;
    login: (email: string, password: string) => Promise<void>;
    signup: (email: string, password: string, name: string) => Promise<void>;
    getCurrentUser: () => Promise<void>;
}