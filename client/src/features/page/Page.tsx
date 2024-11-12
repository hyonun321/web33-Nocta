import { motion, AnimatePresence } from "framer-motion";
import { useRef } from "react";
import { Editor } from "@features/editor/Editor";
import { Page as PageType } from "src/types/page";
import { pageAnimation, resizeHandleAnimation } from "./Page.animation";
import { pageContainer, pageHeader, pageTitle, resizeHandle } from "./Page.style";
import { PageControlButton } from "./components/PageControlButton";
import { usePage } from "./hooks/usePage";

interface PageProps extends PageType {
  handlePageSelect: (pageId: number) => void;
  handlePageClose: (pageId: number) => void;
}

export const Page = ({
  id,
  x,
  y,
  zIndex,
  isActive,
  handlePageSelect,
  handlePageClose,
}: PageProps) => {
  const pageRef = useRef<HTMLDivElement>(null);
  const { position, size, pageDrag, pageResize, pageMinimize, pageMaximize } = usePage({ x, y });

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
          <p className={pageTitle}>title</p>
          <PageControlButton
            onPageClose={() => handlePageClose(id)}
            onPageMaximize={pageMaximize}
            onPageMinimize={pageMinimize}
          />
        </div>
        <Editor />
        <motion.div
          className={resizeHandle}
          onMouseDown={pageResize}
          whileHover={resizeHandleAnimation.whileHover}
        />
      </motion.div>
    </AnimatePresence>
  );
};
