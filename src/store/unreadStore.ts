import { create } from "zustand";

interface UnreadState {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  fetchUnreadCount: () => Promise<void>;
  clearUnreadCount: () => void;
}

export const useUnreadStore = create<UnreadState>((set) => ({
  unreadCount: 0,
  setUnreadCount: (count: number) => set({ unreadCount: count }),
  fetchUnreadCount: async () => {
    try {
      const res = await fetch("/api/profile/unread-count");
      const data = await res.json();
      if (typeof data.count === "number") {
        set({ unreadCount: data.count });
      }
    } catch {
      // ignore
    }
  },
  clearUnreadCount: () => set({ unreadCount: 0 }),
}));
