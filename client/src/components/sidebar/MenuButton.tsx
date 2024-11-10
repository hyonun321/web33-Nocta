import { menuItemWrapper, imageBox, textBox } from "./MenuButton.style";

export const MenuButton = () => {
  return (
    <div className={menuItemWrapper}>
      <div className={imageBox}>
        <img src="https://via.placeholder.com/50" />
      </div>
      <p className={textBox}>Noctturn</p>
    </div>
  );
};
