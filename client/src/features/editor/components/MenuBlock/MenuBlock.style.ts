import { css } from "@styled-system/css";

export const menuBlockStyle = css({
  display: "flex",
  zIndex: 1,
  position: "relative",
  justifyContent: "center",
  alignItems: "center",
  width: "20px",
  height: "20px",
  marginLeft: "-20px",
  transition: "opacity 0.2s ease-in-out",
  cursor: "grab",
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
});
