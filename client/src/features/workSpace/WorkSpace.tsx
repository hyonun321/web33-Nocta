import { Page } from "@features/page/Page";
import { BottomNavigator } from "@components/bottomNavigator/BottonNavigator";
import { Sidebar } from "@components/sidebar/Sidebar";
import { container, content } from "./WorkSpace.style";

const WorkSpace = () => {
  // TODO 여러개의 Page 관리

  return (
    <div className={container}>
      <Sidebar />
      <div className={content}>
        <Page x={0} y={100} />
        <Page x={800} y={10} />
        <Page x={400} y={300} />
      </div>
      <BottomNavigator />
    </div>
  );
};

export default WorkSpace;
