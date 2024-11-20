import { useEffect } from "react";
import { WorkSpace } from "@features/workSpace/WorkSpace";
import { useRefreshQuery } from "./apis/auth";
import { useUserInfo } from "./stores/useUserStore";

const App = () => {
  const { id, name, accessToken } = useUserInfo();
  const { refetch: refreshToken } = useRefreshQuery();

  useEffect(() => {
    if (id && name && !accessToken) {
      refreshToken();
    }
  }, []);

  return (
    <>
      <WorkSpace />
    </>
  );
};

export default App;
