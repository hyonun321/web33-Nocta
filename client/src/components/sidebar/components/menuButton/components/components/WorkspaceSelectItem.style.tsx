// WorkspaceSelectItem.style.ts
import { css } from "@styled-system/css";

export const itemContainer = css({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "md",
  cursor: "pointer",
  _hover: { backgroundColor: "gray.100" },
});

export const itemContent = css({
  display: "flex",
  gap: "2",
  alignItems: "center",
});

export const itemIcon = css({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  borderRadius: "xl",
  width: "8",
  height: "8",
  fontSize: "sm",
  backgroundColor: "gray.200",
});

export const itemInfo = css({
  display: "flex",
  flexDirection: "column",
});

export const itemName = css({
  fontSize: "sm",
  fontWeight: "medium",
});

export const itemRole = css({
  color: "gray.500",
  fontSize: "xs",
});

export const itemMemberCount = css({
  color: "gray.500",
  fontSize: "xs",
});
