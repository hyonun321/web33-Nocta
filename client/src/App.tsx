import { useEffect } from "react";
import { ErrorModal } from "@components/modal/ErrorModal";
import { WorkSpace } from "@features/workSpace/WorkSpace";
import { useErrorStore } from "@stores/useErrorStore";
import { useUserInfo } from "@stores/useUserStore";
import { useSocketStore } from "./stores/useSocketStore";

const App = () => {
  // TODO 라우터, react query 설정
  const { isErrorModalOpen, errorMessage } = useErrorStore();

  const { id } = useUserInfo();

  useEffect(() => {
    const socketStore = useSocketStore.getState();
    socketStore.init(id);

    // // 소켓이 연결된 후에 이벤트 리스너 등록
    // const { socket } = socketStore;
    // socket?.on("connect", () => {
    //   const unsubscribe = socketStore.subscribeToWorkspaceOperations({
    //     onWorkspaceListUpdate: (workspaces) => {
    //       console.log("Workspace list updated:", workspaces);
    //     },
    //   });

    //   return () => {
    //     if (unsubscribe) unsubscribe();
    //   };
    // });

    return () => {
      setTimeout(() => {
        socketStore.cleanup();
      }, 0);
    };
  }, [id]);

  return (
    <>
      {isErrorModalOpen && <ErrorModal errorMessage={errorMessage} />}
      <WorkSpace />
    </>
  );
};

export default App;
