import { WorkSpaceSerializedProps } from "@noctaCrdt/Interfaces";
import { useState, useEffect } from "react";
import { BottomNavigator } from "@components/bottomNavigator/BottomNavigator";
import { ErrorModal } from "@components/modal/ErrorModal";
import { Sidebar } from "@components/sidebar/Sidebar";
import { Page } from "@features/page/Page";
import { useSocket } from "@src/apis/useSocket";
import { workSpaceContainer, content } from "./WorkSpace.style";
import { IntroScreen } from "./components/IntroScreen";
import { usePagesManage } from "./hooks/usePagesManage";
import { useWorkspaceInit } from "./hooks/useWorkspaceInit";

export const WorkSpace = () => {
  const { isLoading, isInitialized, error } = useWorkspaceInit();
  const { pages, addPage, selectPage, closePage, updatePageTitle, initPages } = usePagesManage([]);
  const { socket, fetchWorkspaceData } = useSocket();
  const visiblePages = pages.filter((page) => page.isVisible);
  const workspace = fetchWorkspaceData();
  useEffect(() => {
    if (socket && workspace) {
      initPages(workspace.pageList);
    }
  }, [socket, workspace]);

  if (error) {
    return <ErrorModal errorMessage="test" />;
  }

  return (
    <>
      {isLoading && <IntroScreen />}
      <div
        className={workSpaceContainer({
          visibility: isInitialized && !isLoading ? "visible" : "hidden",
          opacity: isInitialized && !isLoading ? 1 : 0,
        })}
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
              editorCRDT={page.editorCRDT}
            />
          ))}
        </div>
        <BottomNavigator pages={visiblePages} handlePageSelect={selectPage} />
      </div>
    </>
  );
};
