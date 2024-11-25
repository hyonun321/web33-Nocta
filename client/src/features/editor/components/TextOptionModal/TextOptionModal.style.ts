import { css } from "@styled-system/css";

export const optionModal = css({
  zIndex: 1000,
  position: "fixed",
  borderRadius: "4px",
  background: "white",
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
});

export const modalContainer = css({
  display: "flex",
  gap: "4px",
  padding: "8px",
});

export const optionButton = css({
  display: "flex",
  justifyContent: "center",

  alignItems: "center",
  border: "none",
  borderRadius: "4px",
  minWidth: "28px",
  height: "28px",
  padding: "4px 8px",
  background: "#f5f5f5",
  cursor: "pointer",
  "&:hover": {
    background: "#e0e0e0",
  },
});

export const divider = css({
  width: "1px",
  height: "20px",
  margin: "0 8px",
});
