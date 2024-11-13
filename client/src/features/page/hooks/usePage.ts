import { useIsSidebarOpen } from "@src/stores/useSidebarStore";
import { Position, Size } from "@src/types/page";
import { useEffect, useState } from "react";
import { PAGE, SIDE_BAR } from "@constants/size";
import { SPACING } from "@constants/spacing";

const PADDING = SPACING.MEDIUM * 2;

export const usePage = ({ x, y }: Position) => {
  const [position, setPosition] = useState<Position>({ x, y });
  const [size, setSize] = useState<Size>({
    width: PAGE.WIDTH,
    height: PAGE.HEIGHT,
  });

  const isSidebarOpen = useIsSidebarOpen();

  const getSidebarWidth = () => (isSidebarOpen ? SIDE_BAR.WIDTH : SIDE_BAR.MIN_WIDTH);

  useEffect(() => {
    // x 범위 넘어가면 x 위치 조정
    const sidebarWidth = getSidebarWidth();
    if (position.x > window.innerWidth - size.width - sidebarWidth - PADDING) {
      // 만약 최대화 상태라면(사이드바 열었을때, 사이드바가 화면을 가린다면), 포지션 0으로 바꾸고 width도 재조정
      // 만약 최대화가 아니라면, 포지션만 조정하고, 사이즈는 그대로
      if (size.width > window.innerWidth - sidebarWidth - PADDING) {
        setPosition({ x: 0, y: position.y });
        setSize({
          width: window.innerWidth - sidebarWidth - PADDING,
          height: size.height,
        });
      } else {
        setPosition({
          x: position.x - sidebarWidth + PADDING,
          y: position.y,
        });
        setSize({
          width: size.width,
          height: size.height,
        });
      }
    }
  }, [isSidebarOpen]);

  const pageDrag = (e: React.PointerEvent) => {
    e.preventDefault();
    const startX = e.clientX - position.x;
    const startY = e.clientY - position.y;

    const handleDragMove = (e: PointerEvent) => {
      const newX = Math.max(
        0,
        Math.min(window.innerWidth - size.width - getSidebarWidth() - PADDING, e.clientX - startX),
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
        Math.min(startWidth + deltaX, window.innerWidth - position.x - getSidebarWidth() - PADDING),
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
      width: window.innerWidth - getSidebarWidth() - PADDING,
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
