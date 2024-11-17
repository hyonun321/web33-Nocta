import { BottomNavigator } from "@components/bottomNavigator/BottomNavigator";
import { Sidebar } from "@components/sidebar/Sidebar";
import { Page } from "@features/page/Page";
import { container, content } from "./WorkSpace.style";
import { ErrorScreen } from "./components/ErrorScreen";
import { IntroScreen } from "./components/IntroScreen";
import { usePagesManage } from "./hooks/usePagesManage";
import { useWorkspaceInit } from "./hooks/useWorkspaceInit";

export const WorkSpace = () => {
  const { isLoading, isInitialized, error } = useWorkspaceInit();

  const { pages, addPage, selectPage, closePage, updatePageTitle } = usePagesManage();
  const visiblePages = pages.filter((page) => page.isVisible);

  if (error) {
    return <ErrorScreen errorMessage={error.message} />;
  }

  return (
    <>
      <IntroScreen isVisible={isLoading} />
      <div
        className={container}
        style={{
          visibility: isInitialized && !isLoading ? "visible" : "hidden",
          opacity: isInitialized && !isLoading ? 1 : 0,
          transition: "opacity 0.3s ease-in-out",
        }}
      >
        <Sidebar pages={pages} handlePageAdd={addPage} handlePageSelect={selectPage} />
        <div className={content}>
          {visiblePages.map((page) => (
            <Page
              key={page.id}
              {...page}
              handlePageSelect={selectPage}
              handlePageClose={closePage}
              handleTitleChange={updatePageTitle}
            />
          ))}
        </div>
        <BottomNavigator pages={visiblePages} handlePageSelect={selectPage} />
      </div>
    </>
  );
};
