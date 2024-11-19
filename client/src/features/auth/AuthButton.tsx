import { useLogoutMutation } from "@src/apis/auth";
import { TextButton } from "@src/components/button/textButton";
import { Modal } from "@src/components/modal/modal";
import { useModal } from "@src/components/modal/useModal";
import { useCheckLogin } from "@src/stores/useUserStore";
import { AuthModal } from "./AuthModal";

export const AuthButton = () => {
  const isLogin = useCheckLogin();

  const {
    isOpen: isAuthModalOpen,
    openModal: openAuthModal,
    closeModal: closeAuthModal,
  } = useModal();

  const {
    isOpen: isLogoutModalOpen,
    openModal: openLogoutModal,
    closeModal: closeLogoutModal,
  } = useModal();

  const { mutate: logout } = useLogoutMutation(closeLogoutModal);

  return (
    <>
      {isLogin ? (
        <TextButton variant="secondary" onClick={openLogoutModal}>
          로그아웃
        </TextButton>
      ) : (
        <TextButton variant="secondary" onClick={openAuthModal}>
          로그인
        </TextButton>
      )}

      <AuthModal isOpen={isAuthModalOpen} onClose={closeAuthModal} />
      <Modal
        isOpen={isLogoutModalOpen}
        primaryButtonLabel="로그아웃"
        primaryButtonOnClick={logout}
        secondaryButtonLabel="취소"
        secondaryButtonOnClick={closeLogoutModal}
      >
        <p>로그아웃 하시겠습니까?</p>
      </Modal>
    </>
  );
};
