import { css } from "@styled-system/css";

export const IconModal = css({
  zIndex: 9000,
  position: "absolute",
  top: 14,
  left: 14,
});

export const IconModalContainer = css({
  zIndex: 1001,
  position: "relative",
  borderRadius: "4px",
  width: "100%",
  maxHeight: "80vh",
  padding: "16px",
  backgroundColor: "white",
  boxShadow: "lg",
  overflowY: "auto",
});

export const IconModalClose = css({
  display: "flex",
  position: "absolute",
  top: "8px",
  right: "8px",
  justifyContent: "center",
  alignItems: "center",
  border: "none",
  borderRadius: "md",
  width: "24px",
  height: "24px",
  backgroundColor: "transparent",
  cursor: "pointer",
  _hover: {
    backgroundColor: "gray.100",
  },
});

export const IconName = css({
  marginBottom: "8px",
  color: "gray.600",
  fontSize: "sm",
  fontWeight: "medium",
});

export const IconButton = (isSelected: boolean) =>
  css({
    display: "flex",
    gap: "4px",
    flexDirection: "column",
    justifyContent: "space-between",
    alignItems: "center",
    border: "none",
    borderRadius: "md",
    padding: "8px",
    backgroundColor: isSelected ? "gray.100" : "transparent",
    cursor: "pointer",
    _hover: {
      backgroundColor: isSelected ? "gray.100" : "gray.50",
    },
  });
