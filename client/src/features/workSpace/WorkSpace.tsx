import { WorkSpace as WorkSpaceClass } from "@noctaCrdt/WorkSpace";
import { useState, useEffect } from "react";
import { BottomNavigator } from "@components/bottomNavigator/BottomNavigator";
import { ErrorModal } from "@components/modal/ErrorModal";
import { Sidebar } from "@components/sidebar/Sidebar";
import { Page } from "@features/page/Page";
import { useSocketStore } from "@src/stores/useSocketStore";
import { workSpaceContainer, content } from "./WorkSpace.style";
import { IntroScreen } from "./components/IntroScreen";
import { usePagesManage } from "./hooks/usePagesManage";
import { useWorkspaceInit } from "./hooks/useWorkspaceInit";

export const WorkSpace = () => {
  const [workspace, setWorkspace] = useState<WorkSpaceClass | null>(null);
  const { isLoading, isInitialized, error } = useWorkspaceInit();
  const { workspace: workspaceMetadata, clientId } = useSocketStore();

  const {
    pages,
    fetchPage,
    selectPage,
    closePage,
    updatePage,
    initPages,
    initPagePosition,
    openPage,
  } = usePagesManage(workspace, clientId);
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
  // 0. 몽고 다 제거
  // 1. 클라이언트 연결하고 tempblock으로 클라이언트 블럭 생성한다.
  // 2. 클라이언트를 새로고침한다
  // 3. 추가된 블럭의 콘솔로그 정보를 본다.
  // 4. 클라이언트 인스턴스의 clock정보를 본다.

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
        <Sidebar
          pages={pages}
          handlePageAdd={fetchPage}
          handlePageOpen={openPage}
          handlePageUpdate={updatePage}
        />
        <div className={content}>
          {visiblePages.map((page) =>
            page.isLoaded ? (
              <Page
                key={page.id}
                {...page}
                handlePageSelect={selectPage}
                handlePageClose={closePage}
                handleTitleChange={updatePage}
              />
            ) : null,
          )}
        </div>
        <BottomNavigator pages={visiblePages} handlePageSelect={openPage} />
      </div>
    </>
  );
};
