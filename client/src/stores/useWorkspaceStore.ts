import { create } from "zustand";

// 워크스페이스 권한 타입 정의

interface WorkspaceStore {
  // 현재 선택된 워크스페이스의 권한
  currentRole: string | null;
  // 권한 설정 함수
  setCurrentRole: (role: string | null) => void;
}

export const useWorkspaceStore = create<WorkspaceStore>((set) => ({
  currentRole: null,
  setCurrentRole: (role) => set({ currentRole: role }),
}));
