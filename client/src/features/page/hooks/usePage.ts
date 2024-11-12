import { PAGE, SIDE_BAR } from "@constants/size";
import { SPACING } from "@constants/spacing";
import { useState } from "react";
import { Position, Size } from "src/types/page";

const PADDING = SPACING.MEDIUM * 2;

export const usePage = ({ x, y }: Position) => {
  const [position, setPosition] = useState<Position>({ x, y });
  const [size, setSize] = useState<Size>({
    width: PAGE.WIDTH,
    height: PAGE.HEIGHT,
  });

  const pageDrag = (e: React.PointerEvent) => {
    e.preventDefault();
    const startX = e.clientX - position.x;
    const startY = e.clientY - position.y;

    const handleDragMove = (e: PointerEvent) => {
      const newX = Math.max(
        0,
        Math.min(window.innerWidth - size.width - SIDE_BAR.WIDTH - PADDING, e.clientX - startX),
      );
      const newY = Math.max(
        0,
        Math.min(window.innerHeight - size.height - PADDING, e.clientY - startY),
      );
      setPosition({ x: newX, y: newY });
    };

    const handleDragEnd = () => {
      document.removeEventListener("pointermove", handleDragMove);
      document.removeEventListener("pointerup", handleDragEnd);
    };

    document.addEventListener("pointermove", handleDragMove);
    document.addEventListener("pointerup", handleDragEnd);
  };

  const pageResize = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = size.width;
    const startHeight = size.height;

    const resize = (e: MouseEvent) => {
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      const newWidth = Math.max(
        PAGE.MIN_WIDTH,
        Math.min(startWidth + deltaX, window.innerWidth - position.x - SIDE_BAR.WIDTH - PADDING),
      );

      const newHeight = Math.max(
        PAGE.MIN_HEIGHT,
        Math.min(startHeight + deltaY, window.innerHeight - position.y - PADDING),
      );

      setSize({ width: newWidth, height: newHeight });
    };

    const stopResize = () => {
      document.removeEventListener("mousemove", resize);
      document.removeEventListener("mouseup", stopResize);
    };

    document.addEventListener("mousemove", resize);
    document.addEventListener("mouseup", stopResize);
  };

  const pageMinimize = () => {
    setSize({
      width: PAGE.MIN_WIDTH,
      height: PAGE.MIN_HEIGHT,
    });
  };

  const pageMaximize = () => {
    setPosition({ x: 0, y: 0 });
    setSize({
      width: window.innerWidth - SIDE_BAR.WIDTH - PADDING,
      height: window.innerHeight - PADDING,
    });
  };

  return {
    position,
    size,
    pageDrag,
    pageResize,
    pageMinimize,
    pageMaximize,
  };
};
