import { serializedEditorDataProps } from "@noctaCrdt/Interfaces";
import { motion, AnimatePresence } from "framer-motion";
import { Editor } from "@features/editor/Editor";
import { Page as PageType } from "@src/types/page";
import { pageContainer, pageHeader, resizeHandles } from "./Page.style";
import { PageControlButton } from "./components/PageControlButton/PageControlButton";
import { PageTitle } from "./components/PageTitle/PageTitle";
import { DIRECTIONS, usePage } from "./hooks/usePage";

interface PageProps extends PageType {
  handlePageSelect: ({ pageId, isSidebar }: { pageId: string; isSidebar?: boolean }) => void;
  handlePageClose: (pageId: string) => void;
  handleTitleChange: (pageId: string, newTitle: string) => void;
  serializedEditorData: serializedEditorDataProps;
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
  serializedEditorData,
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
      <div
        className={pageContainer}
        style={{
          width: `${size.width}px`,
          height: `${size.height}px`,
          transform: `translate(${position.x}px, ${position.y}px)`,
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
        <Editor
          onTitleChange={onTitleChange}
          pageId={id}
          serializedEditorData={serializedEditorData}
        />
        {DIRECTIONS.map((direction) => (
          <motion.div
            key={direction}
            className={resizeHandles[direction]}
            onMouseDown={(e) => pageResize(e, direction)}
          />
        ))}
      </div>
    </AnimatePresence>
  );
};
