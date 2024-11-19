import { motion } from "framer-motion";
import { IconButton } from "@components/button/IconButton";
import { Modal } from "@components/modal/modal";
import { useModal } from "@components/modal/useModal";
import { MAX_VISIBLE_PAGE } from "@src/constants/page";
import { AuthButton } from "@src/features/auth/AuthButton";
import { useIsSidebarOpen, useSidebarActions } from "@src/stores/useSidebarStore";
import { Page } from "@src/types/page";
import { MenuButton } from "./MenuButton";
import { PageItem } from "./PageItem";
import { animation, contentVariants, sidebarVariants } from "./Sidebar.animation";
import { sidebarContainer, navWrapper, plusIconBox, sidebarToggleButton } from "./Sidebar.style";

export const Sidebar = ({
  pages,
  handlePageAdd,
  handlePageSelect,
}: {
  pages: Page[];
  handlePageAdd: () => void;
  handlePageSelect: ({ pageId }: { pageId: number }) => void;
}) => {
  const visiblePages = pages.filter((page) => page.isVisible);
  const isMaxVisiblePage = visiblePages.length >= MAX_VISIBLE_PAGE;

  const isSidebarOpen = useIsSidebarOpen();
  const { toggleSidebar } = useSidebarActions();
  const { isOpen, openModal, closeModal } = useModal();

  const handlePageItemClick = (id: number) => {
    if (isMaxVisiblePage) {
      openModal();
      return;
    }
    handlePageSelect({ pageId: id });
  };

  const handleAddPageButtonClick = () => {
    if (isMaxVisiblePage) {
      openModal();
      return;
    }
    handlePageAdd();
  };

  return (
    <motion.aside
      className={sidebarContainer}
      initial="open"
      animate={isSidebarOpen ? "open" : "closed"}
      variants={sidebarVariants}
    >
      <div className={sidebarToggleButton} onClick={toggleSidebar}>
        {isSidebarOpen ? "«" : "»"}
      </div>
      <motion.div variants={contentVariants}>
        <MenuButton />
      </motion.div>
      <motion.nav className={navWrapper} variants={contentVariants}>
        {pages?.map((item) => (
          <motion.div
            key={item.id}
            initial={animation.initial}
            animate={animation.animate}
            transition={animation.transition}
          >
            <PageItem {...item} onClick={() => handlePageItemClick(item.id)} />
          </motion.div>
        ))}
      </motion.nav>
      <motion.div className={plusIconBox} variants={contentVariants}>
        <IconButton icon="➕" onClick={handleAddPageButtonClick} size="sm" />
        <AuthButton />
      </motion.div>
      <Modal isOpen={isOpen} primaryButtonLabel="확인" primaryButtonOnClick={closeModal}>
        <p>
          최대 {MAX_VISIBLE_PAGE}개의 페이지만 표시할 수 있습니다
          <br />
          사용하지 않는 페이지는 닫아주세요.
        </p>
      </Modal>
    </motion.aside>
  );
};
