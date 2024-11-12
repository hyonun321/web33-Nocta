import { pageTitle } from "./PageTitle.style";

interface PageTitleProps {
  title: string;
}

export const PageTitle = ({ title }: PageTitleProps) => {
  return <p className={pageTitle}>{title || "Title"}</p>;
};
