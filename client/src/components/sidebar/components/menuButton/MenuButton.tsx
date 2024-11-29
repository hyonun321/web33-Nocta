import { useState, useEffect } from "react";
import { InviteModal } from "@src/components/modal/InviteModal";
import { useModal } from "@src/components/modal/useModal";
import { useUserInfo } from "@stores/useUserStore";
import { menuItemWrapper, textBox, menuButtonContainer } from "./MenuButton.style";
import { MenuIcon } from "./components/MenuIcon";
import { WorkspaceSelectModal } from "./components/WorkspaceSelectModal";

export const MenuButton = () => {
  const { name } = useUserInfo();
  const [isOpen, setIsOpen] = useState(false);
  const {
    isOpen: isInviteModalOpen,
    openModal: openInviteModal,
    closeModal: closeInviteModal,
  } = useModal();

  const handleMenuClick = () => {
    setIsOpen((prev) => !prev);
  };

  const handleClickOutside = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.closest(`.menu_button_container`)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleInvite = (email: string) => {
    console.log("Invite user:", email);
  };

  return (
    <>
      <button className={`${menuButtonContainer} menu_button_container`} onClick={handleMenuClick}>
        <button className={menuItemWrapper}>
          <MenuIcon />
          <p className={textBox}>{name ?? "Nocta"}</p>
        </button>
        <WorkspaceSelectModal isOpen={isOpen} userName={name} onInviteClick={openInviteModal} />
      </button>
      <InviteModal isOpen={isInviteModalOpen} onClose={closeInviteModal} onInvite={handleInvite} />
    </>
  );
};
