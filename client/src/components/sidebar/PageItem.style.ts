import { css } from "@styled-system/css";

export const pageItemContainer = css({
  display: "flex",
  gap: "sm",
  alignItems: "center",
  width: "100%",
  paddingInline: "md",
  "&:hover": {
    background: "white/50",
    cursor: "pointer",
  },
});

export const iconBox = css({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  borderRadius: "xs",
  width: "44px",
  height: "44px",
  fontSize: "24px",
  background: "white",
});

export const textBox = css({
  textStyle: "display-medium20",
  color: "gray.700",
});
