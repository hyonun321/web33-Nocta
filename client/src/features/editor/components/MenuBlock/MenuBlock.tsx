import DraggableIcon from "@assets/icons/draggable.svg";
import { menuBlockStyle, dragHandleIconStyle } from "./MenuBlock.style";

interface MenuBlockProps {
  attributes?: Record<string, any>;
  listeners?: Record<string, any>;
}

export const MenuBlock = ({ attributes, listeners }: MenuBlockProps) => {
  return (
    <div className={menuBlockStyle} {...attributes} {...listeners}>
      <div className={dragHandleIconStyle}>
        <img src={DraggableIcon} alt="drag handle" width="10" height="10" />
      </div>
    </div>
  );
};
