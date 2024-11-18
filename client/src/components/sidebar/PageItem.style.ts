import { css } from "@styled-system/css";

export const pageItemContainer = css({
  display: "flex",
  gap: "sm",
  alignItems: "center",
  width: "100%",
  height: "56px",
  paddingInline: "md",
  "&:hover": {
    background: "white/50",
    cursor: "pointer",
  },
});

export const iconBox = css({
  display: "flex",
  flexShrink: 0,
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
  textOverflow: "ellipsis",
  overflow: "hidden",
  whiteSpace: "nowrap",
});
