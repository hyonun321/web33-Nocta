import { Editor } from "@features/editor/Editor";
import { pageContainer, pageHeader, pageTitle } from "./Page.style";
import { PageControlButton } from "./components/PageControlButton";

interface PageProps {
  x?: number;
  y?: number;
}

export const Page = ({ x = 0, y = 0 }: PageProps) => {
  const position = {
    left: `${x}px`,
    top: `${y}px`,
  };

  const handlePageMinimize = () => {};
  const handlePageMaximize = () => {};
  const handlePageClose = () => {};

  return (
    <div className={pageContainer} style={position}>
      <div className={pageHeader}>
        <p className={pageTitle}>title</p>
        <PageControlButton
          onPageClose={handlePageClose}
          onPageMaximize={handlePageMaximize}
          onPageMinimize={handlePageMinimize}
        />
      </div>
      <Editor />
    </div>
  );
};
