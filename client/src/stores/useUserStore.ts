import { create } from "zustand";

interface UserStore {
  id: string | null;
  name: string | null;
  accessToken: string | null;
  actions: {
    setUserInfo: (id: string, name: string, accessToken: string) => void;
    removeUserInfo: () => void;
    updateAccessToken: (accessToken: string) => void;
    checkAuth: () => boolean;
  };
}

const useUserStore = create<UserStore>((set, get) => ({
  id: null,
  name: null,
  accessToken: null,
  actions: {
    setUserInfo: (id: string, name: string, accessToken: string) =>
      set(() => ({ id, name, accessToken })),
    removeUserInfo: () => set(() => ({ id: null, name: null, accessToken: null })),
    updateAccessToken: (accessToken: string) => set(() => ({ accessToken })),
    checkAuth: () => {
      const state = get();
      return !!(state.id && state.name && state.accessToken);
    },
  },
}));

// store 값을 변경하는 부분. 주로 api 코드에서 사용
export const useUserActions = () => useUserStore((state) => state.actions);

// store 값을 사용하는 부분. 주로 component 내부에서 사용
export const useUserInfo = () => useUserStore.getState();
export const useCheckLogin = () =>
  useUserStore((state) => !!(state.id && state.name && state.accessToken));
