import { motion, AnimatePresence } from "framer-motion";
import { Editor } from "@features/editor/Editor";
import { Page as PageType } from "@src/types/page";
import { pageAnimation, resizeHandleAnimation } from "./Page.animation";
import { pageContainer, pageHeader, resizeHandle } from "./Page.style";

import { PageControlButton } from "./components/PageControlButton/PageControlButton";
import { PageTitle } from "./components/PageTitle/PageTitle";
import { usePage } from "./hooks/usePage";

interface PageProps extends PageType {
  handlePageSelect: ({ pageId, isSidebar }: { pageId: string; isSidebar?: boolean }) => void;
  handlePageClose: (pageId: string) => void;
  handleTitleChange: (pageId: string, newTitle: string) => void;
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
  editorCRDT,
}: PageProps) => {
  const { position, size, pageDrag, pageResize, pageMinimize, pageMaximize } = usePage({ x, y });

  // TODO: workspace에서 pageId, editorCRDT props로 받아와야 함
  // const {} = useSocket();

  const onTitleChange = (newTitle: string) => {
    handleTitleChange(id, newTitle);
  };

  const handlePageClick = () => {
    if (!isActive) {
      handlePageSelect({ pageId: id });
    }
  };

  return (
    <AnimatePresence>
      <motion.div
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
        onPointerDown={handlePageClick}
      >
        <div className={pageHeader} onPointerDown={pageDrag} onClick={handlePageClick}>
          <PageTitle title={title} />
          <PageControlButton
            onPageClose={() => handlePageClose(id)}
            onPageMaximize={pageMaximize}
            onPageMinimize={pageMinimize}
          />
        </div>
        <Editor onTitleChange={onTitleChange} pageId="" editorCRDT={editorCRDT} />
        <motion.div
          className={resizeHandle}
          onMouseDown={pageResize}
          whileHover={resizeHandleAnimation.whileHover}
        />
      </motion.div>
    </AnimatePresence>
  );
};
