import { useErrorStore } from "@stores/useErrorStore";
import { useEffect } from "react";
import { ErrorModal } from "@components/modal/ErrorModal";
import { WorkSpace } from "@features/workSpace/WorkSpace";
import { useSocketStore } from "./stores/useSocketStore";

const App = () => {
  // TODO 라우터, react query 설정
  const { isErrorModalOpen, errorMessage } = useErrorStore();

  useEffect(() => {
    const socketStore = useSocketStore.getState();
    socketStore.init();
    return () => {
      setTimeout(() => {
        socketStore.cleanup();
      }, 0);
    };
  }, []);

  return (
    <>
      {isErrorModalOpen && <ErrorModal errorMessage={errorMessage} />}
      <WorkSpace />
    </>
  );
};

export default App;
