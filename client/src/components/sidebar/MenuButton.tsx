import { menuItemWrapper, imageBox, textBox } from "./MenuButton.style";

export const MenuButton = () => {
  return (
    <div className={menuItemWrapper}>
      <div className={imageBox}></div>
      <p className={textBox}>Noctturn</p>
    </div>
  );
};
