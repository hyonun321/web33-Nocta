import { pageControlContainer, pageControlButton } from "./PageControlButton.style";

interface PageControlButtonProps {
  onPageMinimize?: () => void;
  onPageMaximize?: () => void;
  onPageClose?: () => void;
}

export const PageControlButton = ({
  onPageMinimize,
  onPageMaximize,
  onPageClose,
}: PageControlButtonProps) => {
  return (
    <div className={pageControlContainer}>
      <button className={pageControlButton({ color: "yellow" })} onClick={onPageMinimize} />

      <button className={pageControlButton({ color: "red" })} onClick={onPageClose} />

      <button className={pageControlButton({ color: "green" })} onClick={onPageMaximize} />
    </div>
  );
};
