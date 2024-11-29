import { css } from "@styled-system/css";

export const menuItemWrapper = css({
  display: "flex",
  gap: "md",
  alignItems: "center",
  width: "250px",
  padding: "md",
  cursor: "pointer",
  "&:hover": {
    backgroundColor: "gray.100",
  },
});

export const textBox = css({
  color: "gray.700",
  fontSize: "md",
});

export const menuButtonContainer = css({
  position: "relative",
  _before: {
    position: "absolute",
    top: "100%",
    left: 0,
    width: "100%",
    height: "4px", // top: calc(100% + 4px)와 동일한 값
    content: '""',
  },
});
