import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { devtools } from "zustand/middleware";

export type SocketState = {
  socket: any;
  isConnected: boolean;
  actions: {
    setSocket: (socket: any) => void;
    setIsConnected: (isConnected: boolean) => void;
  };
};

const initialState = {
  socket: null,
  isConnected: false,
};

export const useSocketStore = create<SocketState>()(
  devtools(
    immer((set) => ({
      ...initialState,
      actions: {
        setSocket: (socket) =>
          set((state) => {
            state.socket = socket;
          }),
        setIsConnected: (isConnected) =>
          set((state) => {
            state.isConnected = isConnected;
          }),
      },
    })),
  ),
);
