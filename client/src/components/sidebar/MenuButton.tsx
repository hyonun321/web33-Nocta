import { useModal } from "@components/modal/useModal";
import { AuthModal } from "@src/features/auth/AuthModal";
import { menuItemWrapper, imageBox, textBox } from "./MenuButton.style";

export const MenuButton = () => {
  const { isOpen, openModal, closeModal } = useModal();

  return (
    <>
      <button className={menuItemWrapper} onClick={openModal}>
        <div className={imageBox}></div>
        <p className={textBox}>Noctturn</p>
      </button>
      <AuthModal isOpen={isOpen} onClose={closeModal} />
    </>
  );
};
