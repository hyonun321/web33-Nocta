import { useState, useEffect } from "react";
import { useUserInfo } from "@stores/useUserStore";
import { menuItemWrapper, textBox, menuButtonContainer } from "./MenuButton.style";
import { MenuIcon } from "./components/MenuIcon";
import { WorkspaceSelectModal } from "./components/WorkspaceSelectModal";

export const MenuButton = () => {
  const { name } = useUserInfo();
  const [isOpen, setIsOpen] = useState(false);

  const handleMenuClick = () => {
    setIsOpen((prev) => !prev); // 토글 형태로 변경
  };

  // 모달 외부 클릭시 닫기 처리를 위한 함수
  const handleClickOutside = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.closest(`.menu_button_container`)) {
      setIsOpen(false);
    }
  };

  // 외부 클릭 이벤트 리스너 등록
  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <button
      className={`${menuButtonContainer} menu_button_container`}
      onClick={handleMenuClick}
      data-onboarding="menu-button"
    >
      <button className={menuItemWrapper}>
        <MenuIcon />
        <p className={textBox}>{name ?? "Nocta"}</p>
      </button>
      <WorkspaceSelectModal isOpen={isOpen} userName={name} />
    </button>
  );
};
