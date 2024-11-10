import { iconButtonContainer, iconBox } from "./IconButton.style";

interface IconButtonProps {
  icon: string;
  size: "sm" | "md";
  onClick?: () => void;
}

export const IconButton = ({ icon, size, onClick }: IconButtonProps) => {
  // TODO 추후 svg 파일을 받아올 수 있도록 수정 (사이드바 - 페이지 추가 버튼)
  return (
    <button className={iconButtonContainer({ size })} onClick={onClick}>
      <span className={iconBox({ size })}>{icon}</span>
    </button>
  );
};
