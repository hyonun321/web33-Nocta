import { motion, AnimatePresence } from "framer-motion";
import { IconButton } from "@components/button/IconButton";
import { Page } from "src/types/page";
import { MenuButton } from "./MenuButton";
import { PageItem } from "./PageItem";
import { animation } from "./Sidebar.animation";
import { sidebarContainer, navWrapper, plusIconBox } from "./Sidebar.style";

export const Sidebar = ({
  pages,
  handlePageAdd,
  handlePageSelect,
}: {
  pages: Page[];
  handlePageAdd: () => void;
  handlePageSelect: (pageId: number, isSidebar: boolean) => void;
}) => {
  return (
    <aside className={sidebarContainer}>
      <MenuButton />
      <AnimatePresence>
        <nav className={navWrapper}>
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
        </nav>
      </AnimatePresence>
      <motion.div className={plusIconBox}>
        <IconButton icon="➕" size="sm" onClick={handlePageAdd} />
      </motion.div>
    </aside>
  );
};
