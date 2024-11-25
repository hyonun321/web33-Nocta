import { serializedEditorDataProps } from "@noctaCrdt/Interfaces";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";
import { Editor } from "@features/editor/Editor";
import { useSocketStore } from "@src/stores/useSocketStore";
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

  const onTitleChange = (newTitle: string) => {
    handleTitleChange(id, newTitle);
  };

  const handlePageClick = () => {
    if (!isActive) {
      handlePageSelect({ pageId: id });
    }
  };

  useEffect(() => {
    const socketStore = useSocketStore.getState();
    if (!socketStore.socket) return;

    // 페이지 열기 시 join/page 이벤트 전송
    socketStore.socket.emit("join/page", { pageId: id });
    console.log(id, "전송완료");
    // 페이지 닫기 시 leave/page 이벤트 전송
    return () => {
      if (socketStore.socket) {
        socketStore.socket.emit("leave/page", { pageId: id });
        console.log(id, "퇴장완료");
      }
    };
  }, [id]);

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
        <Editor
          onTitleChange={onTitleChange}
          pageId={id}
          serializedEditorData={serializedEditorData}
        />
        <motion.div
          className={resizeHandle}
          onMouseDown={pageResize}
          whileHover={resizeHandleAnimation.whileHover}
        />
      </motion.div>
    </AnimatePresence>
  );
};
