import { WorkSpace as WorkSpaceClass } from "@noctaCrdt/WorkSpace";
import { useState, useEffect } from "react";
import { BottomNavigator } from "@components/bottomNavigator/BottomNavigator";
import { ErrorModal } from "@components/modal/ErrorModal";
import { Sidebar } from "@components/sidebar/Sidebar";
import { Page } from "@features/page/Page";
import { useSocket } from "@src/apis/useSocket";
import { useSocketStore } from "@src/stores/useSocketStore";
import { workSpaceContainer, content } from "./WorkSpace.style";
import { IntroScreen } from "./components/IntroScreen";
import { usePagesManage } from "./hooks/usePagesManage";
import { useWorkspaceInit } from "./hooks/useWorkspaceInit";

export const WorkSpace = () => {
  const [workspace, setWorkspace] = useState<WorkSpaceClass | null>(null);
  const { isLoading, isInitialized, error } = useWorkspaceInit();
  // const { socket, fetchWorkspaceData } = useSocket(); // TODO zustand로 변경
  const { workspace: workspaceMetadata } = useSocketStore();
  const { pages, addPage, selectPage, closePage, updatePageTitle, initPages, initPagePosition } =
    usePagesManage();
  const visiblePages = pages.filter((page) => page.isVisible);
  useEffect(() => {
    if (workspaceMetadata) {
      const newWorkspace = new WorkSpaceClass(workspaceMetadata.id, workspaceMetadata.pageList);
      newWorkspace.deserialize(workspaceMetadata);
      setWorkspace(newWorkspace);

      initPages(newWorkspace.pageList);
      initPagePosition();
    }
  }, [workspaceMetadata]);

  // 에러화면
  if (error) {
    return <ErrorModal errorMessage="서버와 연결할 수 없습니다." />;
  }

  // 정상화면
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
            />
          ))}
        </div>
        <BottomNavigator pages={visiblePages} handlePageSelect={selectPage} />
      </div>
    </>
  );
};
