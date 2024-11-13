import { pageItemContainer, iconBox, textBox } from "./PageItem.style";

interface PageItemProps {
  id: number;
  title: string;
  icon?: string;
  onClick: () => void;
}

export const PageItem = ({ icon, title, onClick }: PageItemProps) => {
  return (
    <div className={pageItemContainer} onClick={onClick}>
      <span className={iconBox}>{icon}</span>
      <span className={textBox}>{title}</span>
    </div>
  );
};
