import { useState, useEffect } from "react";
import { useSocketStore } from "@src/stores/useSocketStore";

interface UseWorkspaceInitReturn {
  isLoading: boolean;
  isInitialized: boolean;
  error: Error | null;
}

export const useWorkspaceInit = (): UseWorkspaceInitReturn => {
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { socket } = useSocketStore();
  const isDevelopment = process.env.NODE_ENV === "development";

  const IntroWaitTime = isDevelopment ? 0 : 5500;
  useEffect(() => {
    const initializeWorkspace = async () => {
      try {
        // TODO: 필요한 초기 데이터 로드
        // 예시:
        // await Promise.all([
        //   fetchUserSettings(),
        //   fetchInitialPages(),
        //   fetchWorkspaceData(),
        // ]);
        // 개발 중에는 임시로 딜레이를 줘서 스플래시 화면 확인
        await new Promise((resolve) => setTimeout(resolve, IntroWaitTime));

        setIsInitialized(true);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to initialize workspace"));
      } finally {
        // 페이드 아웃 효과를 위한 약간의 딜레이
        setTimeout(() => {
          setIsLoading(false);
        }, 500);
      }
    };

    initializeWorkspace();
  }, [socket]);

  return { isLoading, isInitialized, error };
};
