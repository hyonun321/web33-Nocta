import { pageItemContainer, iconBox, textBox } from "./PageItem.style";

interface PageItemProps {
  id: number;
  page: string;
  icon?: string;
}

export const PageItem = ({ icon, page }: PageItemProps) => {
  return (
    <div className={pageItemContainer}>
      <span className={iconBox}>{icon}</span>
      <span className={textBox}>{page}</span>
    </div>
  );
};
