import { useUserInfo } from "@src/stores/useUserStore";
import { menuItemWrapper, imageBox, textBox } from "./MenuButton.style";

export const MenuButton = () => {
  const { name } = useUserInfo();

  return (
    <>
      <button className={menuItemWrapper}>
        <div className={imageBox}></div>
        <p className={textBox}>{name ?? "Nocta"}</p>
      </button>
    </>
  );
};
