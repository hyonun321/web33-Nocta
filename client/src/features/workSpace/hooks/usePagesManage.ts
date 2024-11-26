import { serializedEditorDataProps } from "@noctaCrdt/Interfaces";
import { Page as CRDTPage } from "@noctaCrdt/Page";
import { WorkSpace } from "@noctaCrdt/WorkSpace";
import { useEffect, useState, useRef, useCallback } from "react";
import { useSocketStore } from "@src/stores/useSocketStore";
import { Page } from "@src/types/page";

const INIT_ICON = "📄";
const PAGE_OFFSET = 60;

export const usePagesManage = (workspace: WorkSpace | null, clientId: number | null) => {
  const [pages, setPages] = useState<Page[]>([]);
  const { subscribeToPageOperations, sendPageCreateOperation, sendPageUpdateOperation } =
    useSocketStore();
  const subscriptionRef = useRef(false);
  useEffect(() => {
    if (!workspace) return;
    if (subscriptionRef.current) return;
    subscriptionRef.current = true;

    const unsubscribe = subscribeToPageOperations({
      onRemotePageUpdate: (operation) => {
        console.log(operation, "page : 업데이트 확인합니다이");
        workspace.remotePageUpdate({
          pageId: operation.pageId,
          icon: operation.icon,
          title: operation.title,
          workspaceId: operation.workspaceId,
          clientId: operation.clientId,
        });
        setPages((prevPages) =>
          prevPages.map((page) =>
            page.id === operation.pageId
              ? {
                  ...page,
                  title: operation.title || page.title,
                  icon: operation.icon || page.icon,
                }
              : page,
          ),
        );
      },
      onRemotePageCreate: (operation) => {
        console.log(operation, "page : 생성 확인합니다이");
        const newPage = workspace.remotePageCreate({
          page: operation.page!,
          workspaceId: operation.workspaceId,
          clientId: operation.clientId,
        });
        addPage(newPage);
      },
      onRemotePageDelete: (operation) => {
        console.log(operation, "page : 삭제 확인합니다");
        workspace.remotePageDelete?.({
          pageId: operation.pageId,
          workspaceId: operation.workspaceId,
          clientId: operation.clientId,
        });

        setPages((prevPages) => {
          const remainingPages = prevPages.filter((page) => page.id !== operation.pageId);
          return remainingPages;
        });
      },
    });

    return () => {
      subscriptionRef.current = false;
      unsubscribe?.();
    };
  }, [workspace, pages]);

  const updatePageData = useCallback((pageId: string, newData: serializedEditorDataProps) => {
    setPages((prevPages) =>
      prevPages.map((page) =>
        page.id === pageId ? { ...page, serializedEditorData: newData } : page,
      ),
    );
  }, []);

  const getZIndex = () => {
    return Math.max(0, ...pages.map((page) => page.zIndex)) + 1;
  };

  const fetchPage = () => {
    const operation = {
      workspaceId: workspace!.id!,
      clientId: clientId!,
    };
    sendPageCreateOperation(operation);
  };

  const addPage = (newPage: CRDTPage) => {
    const newPageIndex = pages.length;
    const serializedEditorData = newPage.crdt.serialize();
    setPages((prevPages) => [
      ...prevPages.map((page) => ({ ...page, isActive: false })),
      {
        id: newPage.id, // 여기
        title: newPage.title,
        icon: newPage.icon || INIT_ICON,
        x: PAGE_OFFSET * newPageIndex,
        y: PAGE_OFFSET * newPageIndex,
        zIndex: getZIndex(),
        isActive: true,
        isVisible: true,
        isLoaded: false,
        serializedEditorData,
      } as Page,
    ]);
  };

  // 이미 열린 페이지를 선택할 때 사용하는 함수 (데이터 가져오기 수행 안 함)
  const selectPage = ({ pageId }: { pageId: string }) => {
    setPages((prevPages) =>
      prevPages.map((page) =>
        page.id === pageId
          ? { ...page, isActive: true, zIndex: getZIndex(), isVisible: true }
          : { ...page, isActive: false },
      ),
    );
  };
  // 페이지 데이터 로딩 상태 업데이트 함수
  const setPageDataReady = (pageId: string, isLoaded: boolean) => {
    setPages((prevPages) =>
      prevPages.map((page) => (page.id === pageId ? { ...page, isLoaded } : page)),
    );
  };
  // 페이지 데이터를 가져오는 함수
  const fetchPageData = (pageId: string) => {
    const socketStore = useSocketStore.getState();
    const page = pages.find((p) => p.id === pageId);

    if (page && page.isLoaded) {
      // 이미 데이터가 로드된 경우 아무 작업도 하지 않음
      return;
    }
    if (!socketStore.socket) return;

    // 페이지 데이터 수신 핸들러
    const handlePageData = (data: { pageId: string; serializedPage: any }) => {
      if (data.pageId === pageId) {
        console.log("Received new editor data:", data);

        // 페이지 데이터 업데이트
        updatePageData(pageId, data.serializedPage.crdt);

        // 로딩 상태 업데이트
        setPageDataReady(pageId, true);

        // 소켓 이벤트 해제
        socketStore.socket?.off("join/page", handlePageData);
      }
    };

    // 소켓 이벤트 등록 및 데이터 요청
    socketStore.socket.on("join/page", handlePageData);
    socketStore.socket.emit("join/page", { pageId });
  };

  // 페이지를 열 때 사용하는 함수 (데이터가 로드되지 않은 경우 데이터 가져오기 수행)
  const openPage = ({ pageId }: { pageId: string }) => {
    const page = pages.find((p) => p.id === pageId);

    if (page) {
      fetchPageData(pageId);

      // 페이지를 활성화하고 표시
      setPages((prevPages) =>
        prevPages.map((p) =>
          p.id === pageId
            ? { ...p, isActive: true, isVisible: true, zIndex: getZIndex() }
            : { ...p, isActive: false },
        ),
      );
    }
  };
  const closePage = (pageId: string) => {
    setPages((prevPages) =>
      prevPages.map((page) =>
        page.id === pageId ? { ...page, isVisible: false, isLoaded: false } : page,
      ),
    );
  };

  const updatePage = (pageId: string, updates: { title?: string; icon?: string }) => {
    // UI 즉시 업데이트
    setPages((prevPages) =>
      prevPages.map((page) => (page.id === pageId ? { ...page, ...updates } : page)),
    );

    if (clientId && workspace!.id) {
      sendPageUpdateOperation({
        pageId,
        ...updates,
        clientId,
        workspaceId: workspace!.id,
      });
    }
  };

  // 서버에서 처음 불러올때는 좌표를 모르기에, 초기화 과정 필요
  const initPagePosition = () => {
    setPages((prevPages) =>
      prevPages.map((page, index) => ({
        ...page,
        x: PAGE_OFFSET * index,
        y: PAGE_OFFSET * index,
      })),
    );
  };

  const initPages = (list: CRDTPage[]) => {
    const pageList: Page[] = list.map(
      (crdtPage, index) =>
        ({
          id: crdtPage.id,
          title: crdtPage.title,
          icon: crdtPage.icon || INIT_ICON,
          x: PAGE_OFFSET * index,
          y: PAGE_OFFSET * index,
          zIndex: index,
          isActive: index === 0, // 첫 번째 페이지를 활성화
          isVisible: false,
          isLoaded: false,
          serializedEditorData: null,
        }) as Page,
    );
    setPages(pageList);
  };

  useEffect(() => {
    initPages([]);
    initPagePosition();
  }, []);

  return {
    pages,
    fetchPage,
    selectPage,
    openPage,
    closePage,
    updatePageData,
    updatePage,
    initPages,
    initPagePosition,
  };
};
