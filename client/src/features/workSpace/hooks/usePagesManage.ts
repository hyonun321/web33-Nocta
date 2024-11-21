import { EditorCRDT } from "@noctaCrdt/Crdt";
import { Page as CRDTPage } from "@noctaCrdt/Page";
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { Page } from "@src/types/page";

const INIT_ICON = "📄";
const PAGE_OFFSET = 60;

export const usePagesManage = () => {
  const [pages, setPages] = useState<Page[]>([]);
  // const { sendPageOperation } = useSocket();

  const getZIndex = () => {
    return Math.max(0, ...pages.map((page) => page.zIndex)) + 1;
  };

  const addPage = () => {
    const newPageIndex = pages.length;
    const crdt = new EditorCRDT(0); // 0 등의 아무값이여도 상관없음.
    const newPage = new CRDTPage(uuidv4(), "Untitled", INIT_ICON, crdt);
    const serializedEditorData = crdt.serialize();
    // const {page} = sendPageOperation

    setPages((prevPages) => [
      ...prevPages.map((page) => ({ ...page, isActive: false })),
      {
        id: uuidv4(),
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
          isVisible: true,
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
    addPage,
    selectPage,
    closePage,
    updatePageTitle,
    initPages,
    initPagePosition,
  };
};
