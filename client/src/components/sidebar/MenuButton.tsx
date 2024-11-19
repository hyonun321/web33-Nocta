import { useModal } from "@components/modal/useModal";
import { AuthModal } from "@src/features/auth/AuthModal";

import { useCheckLogin, useUserInfo } from "@src/stores/useUserStore";
import { menuItemWrapper, imageBox, textBox } from "./MenuButton.style";

export const MenuButton = () => {
  const { name } = useUserInfo();
  const isLogin = useCheckLogin();
  const { isOpen, openModal, closeModal } = useModal();

  return (
    <>
      <button className={menuItemWrapper} onClick={openModal}>
        <div className={imageBox}></div>
        <p className={textBox}>{name ?? "Nocta"}</p>
      </button>
      {!isLogin && <AuthModal isOpen={isOpen} onClose={closeModal} />}
    </>
  );
};
