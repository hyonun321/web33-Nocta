import { BottomNavigator } from "@components/bottomNavigator/BottomNavigator";
import { Sidebar } from "@components/sidebar/Sidebar";
import { Page } from "@features/page/Page";
import { container, content } from "./WorkSpace.style";
import { usePagesManage } from "./hooks/usePagesManage";

export const WorkSpace = () => {
  const { pages, addPage, selectPage, closePage } = usePagesManage();
  const visiblePages = pages.filter((a) => a.isVisible);

  return (
    <div className={container}>
      <Sidebar pages={pages} handlePageAdd={addPage} handlePageSelect={selectPage} />
      <div className={content}>
        {visiblePages.map((page) => (
          <Page key={page.id} {...page} handlePageSelect={selectPage} handlePageClose={closePage} />
        ))}
      </div>
      <BottomNavigator pages={visiblePages} handlePageSelect={selectPage} />
    </div>
  );
};
