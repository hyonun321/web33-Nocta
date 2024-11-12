import { useState } from "react";
import { Editor } from "@features/editor/Editor";
import { pageContainer, pageHeader } from "./Page.style";
import { PageControlButton } from "./components/PageControlButton/PageControlButton";
import { PageTitle } from "./components/PageTitle/PageTitle";

interface PageProps {
  x?: number;
  y?: number;
}

export const Page = ({ x = 0, y = 0 }: PageProps) => {
  const [title, setTitle] = useState("");
  const position = {
    left: `${x}px`,
    top: `${y}px`,
  };

  const handlePageMinimize = () => {};
  const handlePageMaximize = () => {};
  const handlePageClose = () => {};

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
  };

  return (
    <div className={pageContainer} style={position}>
      <div className={pageHeader}>
        <PageTitle title={title} />
        <PageControlButton
          onPageClose={handlePageClose}
          onPageMaximize={handlePageMaximize}
          onPageMinimize={handlePageMinimize}
        />
      </div>
      <Editor onTitleChange={handleTitleChange}/>
    </div>
  );
};
