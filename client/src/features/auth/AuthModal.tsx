/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState } from "react";
import Lock from "@assets/icons/lock.svg?react";
import Mail from "@assets/icons/mail.svg?react";
import User from "@assets/icons/user.svg?react";
import { Modal } from "@components/modal/modal";
import { InputField } from "@src/components/inputField/InputField";
import { container, formContainer, title, toggleButton } from "./AuthModal.style";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal = ({ isOpen, onClose }: AuthModalProps) => {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const toggleMode = () => {
    setMode(mode === "login" ? "register" : "login");
    resetFormData();
  };

  const resetFormData = () => {
    setFormData({ email: "", password: "", name: "" });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCancelButtonClick = () => {
    resetFormData();
    onClose();
  };

  const handleSubmitButtonClick = () => {
    // TODO API 연결
    resetFormData();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      primaryButtonLabel={mode === "login" ? "로그인" : "회원가입"}
      primaryButtonOnClick={handleSubmitButtonClick}
      secondaryButtonLabel="취소"
      secondaryButtonOnClick={handleCancelButtonClick}
    >
      <div className={container({ mode })}>
        <h1 className={title}>{mode === "login" ? "Login" : "Sign Up"}</h1>
        <div className={formContainer}>
          {mode === "register" && (
            <InputField
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="이름"
              Icon={User}
            />
          )}
          <InputField
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="이메일"
            Icon={Mail}
          />
          <InputField
            type="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder="비밀번호"
            Icon={Lock}
          />
        </div>

        <button onClick={toggleMode} className={toggleButton}>
          {mode === "login"
            ? "계정이 없으신가요? 회원가입하기"
            : "이미 계정이 있으신가요? 로그인하기"}
        </button>
      </div>
    </Modal>
  );
};
