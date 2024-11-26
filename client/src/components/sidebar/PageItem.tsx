import CloseIcon from "@assets/icons/close.svg?react";
import { pageItemContainer, iconBox, textBox, deleteBox } from "./PageItem.style";

interface PageItemProps {
  id: string;
  title: string;
  icon?: string;
  onClick: () => void;
  onDelete?: (id: string) => void; // 추가: 삭제 핸들러
}

export const PageItem = ({ id, icon, title, onClick, onDelete }: PageItemProps) => {
  // 삭제 버튼 클릭 핸들러
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation(); // 상위 요소로의 이벤트 전파 중단
    onDelete?.(id);
  };

  return (
    <div className={pageItemContainer} onClick={onClick}>
      <span className={iconBox}>{icon}</span>
      <span className={textBox}>{title}</span>
      <span className={`delete_box ${deleteBox}`} onClick={handleDelete}>
        <CloseIcon width={16} height={16} />
      </span>
    </div>
  );
};
