import { create } from "zustand";
import { Toast } from "../types/toast";

interface ToastStore {
  toasts: Toast[];
  addToast: (message: string, duration?: number) => void;
  removeToast: (id: number) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (message, duration = 3000) =>
    set((state) => ({
      toasts: [...state.toasts, { id: Date.now(), message, duration }],
    })),
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    })),
}));
