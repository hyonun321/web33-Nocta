import { iconButtonContainer, iconBox } from "./IconButton.style";

interface IconButtonProps {
  icon: string;
  size: "sm" | "md";
  onClick?: () => void;
}

export const IconButton = ({ icon, size, onClick }: IconButtonProps) => {
  return (
    <button className={iconButtonContainer({ size })} onClick={onClick}>
      <span className={iconBox({ size })}>{icon}</span>
    </button>
  );
};
