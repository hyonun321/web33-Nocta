import { create } from "zustand";

// 워크스페이스 권한 타입 정의
export type WorkspaceRole = "owner" | "editor";

interface WorkspaceStore {
  // 현재 선택된 워크스페이스의 권한
  currentRole: WorkspaceRole | null;
  // 권한 설정 함수
  setCurrentRole: (role: WorkspaceRole | null) => void;
}

export const useWorkspaceStore = create<WorkspaceStore>((set) => ({
  currentRole: null,
  setCurrentRole: (role) => set({ currentRole: role }),
}));
