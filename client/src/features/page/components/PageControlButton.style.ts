import { css, cva } from "@styled-system/css";

export const pageControlContainer = css({
  display: "flex",
  gap: "sm",
});

export const pageControlButton = cva({
  base: {
    borderRadius: "full",
    width: "20px",
    height: "20px",
    cursor: "pointer",
  },
  variants: {
    color: {
      yellow: { background: "yellow" },
      green: { background: "green" },
      red: { background: "red" },
    },
  },
});
