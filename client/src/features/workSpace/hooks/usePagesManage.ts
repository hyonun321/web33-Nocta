import { Page as CRDTPage } from "@noctaCrdt/Page";
import { useEffect, useState } from "react";
import { Page } from "@src/types/page";

const INIT_ICON = "📄";
const PAGE_OFFSET = 60;

export const usePagesManage = (list: CRDTPage[]) => {
  const [pages, setPages] = useState<Page[]>([]);

  const getZIndex = () => {
    return Math.max(0, ...pages.map((page) => page.zIndex)) + 1;
  };

  const addPage = () => {
    const newPageIndex = pages.length;

    setPages((prevPages) => [
      ...prevPages.map((page) => ({ ...page, isActive: false })),
      {
        id: newPageIndex,
        title: `Page ${newPageIndex + 1}`,
        icon: INIT_ICON,
        x: PAGE_OFFSET * newPageIndex,
        y: PAGE_OFFSET * newPageIndex,
        zIndex: getZIndex(),
        isActive: true,
        isVisible: true,
      },
    ]);
  };

  const selectPage = ({ pageId }: { pageId: number }) => {
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

  const closePage = (pageId: number) => {
    setPages((prevPages) =>
      prevPages.map((page) => (page.id === pageId ? { ...page, isVisible: false } : page)),
    );
  };

  const updatePageTitle = (pageId: number, newTitle: string) => {
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
    const pageList: Page[] = [];
    list.forEach((page) => {
      const newPage = {
        id: page.id,
        title: page.title,
        icon: page.icon,
        x: 0,
        y: 0,
        zIndex: 0,
        isActive: false,
        isVisible: false,
        editorCRDT: page.crdt,
      };
      pageList.push(newPage);
    });
    setPages((prev) => [...prev, ...pageList]);
  };

  useEffect(() => {
    initPages(list);
    initPagePosition();
  }, []);

  return {
    pages,
    addPage,
    selectPage,
    closePage,
    updatePageTitle,
    initPages,
  };
};
