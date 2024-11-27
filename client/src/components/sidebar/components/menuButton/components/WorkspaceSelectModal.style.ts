import { css, cx } from "@styled-system/css";
import { glassContainer } from "@styled-system/recipes";

export const workspaceListContainer = css({
  display: "flex",
  gap: "sm",
  flexDirection: "column",
  padding: "md",
});

export const workspaceModalContainer = cx(
  glassContainer({
    borderRadius: "bottom",
    background: "non",
    boxShadow: "bottom",
  }),
  css({
    display: "flex",
  }),
);
