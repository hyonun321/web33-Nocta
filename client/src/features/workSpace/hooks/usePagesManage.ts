import { Page } from "@src/types/page";
import { useState } from "react";

interface usePagesManageProps {
  pages: Page[];
  addPage: () => void;
  selectPage: (pageId: number, isSidebar?: boolean) => void;
  closePage: (pageId: number) => void;
  updatePageTitle: (pageId: number, newTitle: string) => void;
}

const INIT_ICON = "📄";
const PAGE_OFFSET = 60;

export const usePagesManage = (): usePagesManageProps => {
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

  const selectPage = (pageId: number, isSidebar: boolean = false) => {
    setPages((prevPages) =>
      prevPages.map((page) => ({
        ...page,
        isActive: page.id === pageId,
        ...(page.id === pageId && {
          zIndex: getZIndex(),
          isVisible: isSidebar ? true : page.isVisible,
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

  return {
    pages,
    addPage,
    selectPage,
    closePage,
    updatePageTitle,
  };
};
