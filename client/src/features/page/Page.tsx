import { motion, AnimatePresence } from "framer-motion";
import { useRef, useState } from "react";
import { Editor } from "@features/editor/Editor";
import { Page as PageType } from "src/types/page";
import { pageAnimation, resizeHandleAnimation } from "./Page.animation";
import { pageContainer, pageHeader, resizeHandle } from "./Page.style";

import { PageControlButton } from "./components/PageControlButton/PageControlButton";
import { PageTitle } from "./components/PageTitle/PageTitle";
import { usePage } from "./hooks/usePage";

interface PageProps extends PageType {
  handlePageSelect: (pageId: number) => void;
  handlePageClose: (pageId: number) => void;
  handleTitleChange: (pageId: number, newTitle: string) => void;
}

export const Page = ({
  id,
  x,
  y,
  title,
  zIndex,
  isActive,
  handlePageSelect,
  handlePageClose,
  handleTitleChange,
}: PageProps) => {
  const pageRef = useRef<HTMLDivElement>(null);
  const { position, size, pageDrag, pageResize, pageMinimize, pageMaximize } = usePage({ x, y });

  const onTitleChange = (newTitle: string) => {
    handleTitleChange(id, newTitle);
  };

  return (
    <AnimatePresence>
      <motion.div
        ref={pageRef}
        className={pageContainer}
        initial={pageAnimation.initial}
        animate={pageAnimation.animate({
          x: position.x,
          y: position.y,
          isActive,
        })}
        style={{
          width: `${size.width}px`,
          height: `${size.height}px`,
          zIndex,
        }}
        onPointerDown={() => handlePageSelect(id)}
      >
        <div className={pageHeader} onPointerDown={pageDrag}>
          <PageTitle title={title} />
          <PageControlButton
            onPageClose={() => handlePageClose(id)}
            onPageMaximize={pageMaximize}
            onPageMinimize={pageMinimize}
          />
        </div>
        <Editor onTitleChange={onTitleChange} />
        <motion.div
          className={resizeHandle}
          onMouseDown={pageResize}
          whileHover={resizeHandleAnimation.whileHover}
        />
      </motion.div>
    </AnimatePresence>
  );
};
