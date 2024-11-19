import { useEffect } from "react";
import { WorkSpace } from "@features/workSpace/WorkSpace";
import { useRefreshMutation } from "./apis/auth";
import { useUserInfo } from "./stores/useUserStore";

const App = () => {
  // TODO 라우터, react query 설정
  const { id } = useUserInfo();
  const { mutate: refreshToken } = useRefreshMutation();

  useEffect(() => {
    // 세션 스토리지에 정보가 있을 경우 토큰 갱신
    if (id) refreshToken();
  }, [id]);

  return (
    <>
      <WorkSpace />
    </>
  );
};

export default App;
