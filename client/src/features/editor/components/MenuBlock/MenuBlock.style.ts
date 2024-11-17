import { css } from "@styled-system/css";

export const menuBlockStyle = css({
  display: "flex",
  position: "absolute",
  top: "50%", // 세로 중앙 정렬
  left: "-28px", // 왼쪽 여백 늘림
  transform: "translateY(-50%)", // 세로 중앙 정렬 보정
  justifyContent: "center",
  alignItems: "center",
  borderRadius: "3px",

  width: "24px",
  height: "24px",
  opacity: 0,
  backgroundColor: "transparent",
  transition: "opacity 0.2s ease-in-out",
  cursor: "grab",
  _hover: {
    backgroundColor: "rgba(55, 53, 47, 0.08)",
  },

  _groupHover: {
    opacity: 1,
  },

  _active: {
    cursor: "grabbing",
  },
});

export const dragHandleIconStyle = css({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  width: "100%",
  height: "100%",
  color: "rgba(55, 53, 47, 0.45)",
});
