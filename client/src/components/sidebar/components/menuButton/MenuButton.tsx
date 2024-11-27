import { useState } from "react";
import { useUserInfo } from "@stores/useUserStore";
import { menuItemWrapper, textBox, menuButtonContainer } from "./MenuButton.style";
import { MenuIcon } from "./components/MenuIcon";
import { WorkspaceSelectModal } from "./components/WorkspaceSelectModal";

export const MenuButton = () => {
  const { name } = useUserInfo();
  const [isHovered, setIsHovered] = useState(false);
  const [isModalHovered, setIsModalHovered] = useState(false);

  const handleClose = () => {
    if (!isHovered && !isModalHovered) {
      setIsHovered(false);
    }
  };

  return (
    <button
      className={menuButtonContainer}
      onMouseEnter={() => {
        setIsHovered(true);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        setTimeout(handleClose, 100);
      }}
    >
      <button className={menuItemWrapper}>
        <MenuIcon />
        <p className={textBox}>{name ?? "Nocta"}</p>
      </button>
      <WorkspaceSelectModal
        isOpen={isHovered || isModalHovered}
        userName={name}
        onMouseEnter={() => setIsModalHovered(true)}
        onMouseLeave={() => {
          setIsModalHovered(false);
          handleClose();
        }}
      />
    </button>
  );
};
