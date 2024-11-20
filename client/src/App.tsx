import { useEffect } from "react";
import { WorkSpace } from "@features/workSpace/WorkSpace";
import { useRefreshQuery } from "./apis/auth";
import { ErrorModal } from "./components/modal/ErrorModal";
import { useErrorStore } from "./stores/useErrorStore";
import { useUserInfo } from "./stores/useUserStore";

const App = () => {
  const { id, name, accessToken } = useUserInfo();
  const { refetch: refreshToken } = useRefreshQuery();
  const { isErrorModalOpen, errorMessage } = useErrorStore();

  useEffect(() => {
    if (id && name && !accessToken) {
      refreshToken();
    }
  }, []);

  return (
    <>
      {isErrorModalOpen && <ErrorModal errorMessage={errorMessage} />}
      <WorkSpace />
    </>
  );
};

export default App;
