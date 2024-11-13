import { useIsSidebarOpen, useSidebarActions } from "@src/stores/useSidebarStore";
import { Page } from "@src/types/page";
import { motion } from "framer-motion";
import { IconButton } from "@components/button/IconButton";
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
  handlePageSelect: (pageId: number, isSidebar: boolean) => void;
}) => {
  const isSidebarOpen = useIsSidebarOpen();
  const { toggleSidebar } = useSidebarActions();

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

      <motion.nav className={navWrapper} variants={contentVariants}>
        <MenuButton />
        {pages?.map((item) => (
          <motion.div
            key={item.id}
            initial={animation.initial}
            animate={animation.animate}
            transition={animation.transition}
          >
            <PageItem {...item} onClick={() => handlePageSelect(item.id, true)} />
          </motion.div>
        ))}
        <div className={plusIconBox}>
          <IconButton icon="➕" size="sm" onClick={handlePageAdd} />
        </div>
      </motion.nav>
    </motion.aside>
  );
};
