import { useEffect } from "react";
import { useRefreshQuery } from "@apis/auth";
import { ErrorModal } from "@components/modal/ErrorModal";
import { WorkSpace } from "@features/workSpace/WorkSpace";
import { useErrorStore } from "@stores/useErrorStore";
import { useUserInfo } from "@stores/useUserStore";
import { useSocketStore } from "./stores/useSocketStore";

const App = () => {
  // TODO 라우터, react query 설정
  const { id, name, accessToken } = useUserInfo();
  const { refetch: refreshToken } = useRefreshQuery();
  const { isErrorModalOpen, errorMessage } = useErrorStore();

  useEffect(() => {
    if (id && name && !accessToken) {
      refreshToken();
    }
  }, []);

  useEffect(() => {
    const socketStore = useSocketStore.getState();
    socketStore.init(accessToken);
    return () => {
      setTimeout(() => {
        socketStore.cleanup();
      }, 0);
    };
  }, [accessToken]);

  return (
    <>
      {isErrorModalOpen && <ErrorModal errorMessage={errorMessage} />}
      <WorkSpace />
    </>
  );
};

export default App;
