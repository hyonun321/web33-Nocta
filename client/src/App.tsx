import { useEffect } from "react";
import { WorkSpace } from "@features/workSpace/WorkSpace";
import { useSocketStore } from "./stores/useSocketStore";

const App = () => {
  // TODO 라우터, react query 설정
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
      <WorkSpace />
    </>
  );
};

export default App;
