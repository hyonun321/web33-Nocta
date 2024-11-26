import { Page as CRDTPage } from "@noctaCrdt/Page";
import { WorkSpace } from "@noctaCrdt/WorkSpace";
import { useEffect, useState, useRef } from "react";
import { useSocketStore } from "@src/stores/useSocketStore";
import { Page } from "@src/types/page";

const INIT_ICON = "📄";
const PAGE_OFFSET = 60;

export const usePagesManage = (workspace: WorkSpace | null, clientId: number | null) => {
  const [pages, setPages] = useState<Page[]>([]);
  const { subscribeToPageOperations, sendPageCreateOperation } = useSocketStore();
  const subscriptionRef = useRef(false);
  useEffect(() => {
    if (!workspace) return;
    if (subscriptionRef.current) return;
    subscriptionRef.current = true;

    const unsubscribe = subscribeToPageOperations({
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
        serializedEditorData,
      } as Page,
    ]);
  };

  const selectPage = ({ pageId }: { pageId: string }) => {
    setPages((prevPages) =>
      prevPages.map((page) => ({
        ...page,
        isActive: page.id === pageId,
        ...(page.id === pageId && {
          zIndex: getZIndex(),
          isVisible: true,
        }),
      })),
    );
  };

  const closePage = (pageId: string) => {
    setPages((prevPages) =>
      prevPages.map((page) => (page.id === pageId ? { ...page, isVisible: false } : page)),
    );
  };

  const updatePageTitle = (pageId: string, newTitle: string) => {
    setPages((prevPages) =>
      prevPages.map((page) => (page.id === pageId ? { ...page, title: newTitle } : page)),
    );
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
          serializedEditorData: crdtPage.crdt.serialize(),
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
    closePage,
    updatePageTitle,
    initPages,
    initPagePosition,
  };
};
