import { css, cx } from "@styled-system/css";
import { glassContainer } from "@styled-system/recipes";

export const sidebarContainer = cx(
  glassContainer({ border: "md", borderRadius: "right" }),
  css({
    display: "flex",
    gap: "lg",
    flexDirection: "column",
    width: "300px",
    height: "calc(100vh - 16px)",
    marginBlock: "8px",
  }),
);
export const navWrapper = css({
  display: "flex",
  gap: "md",
  flexDirection: "column",
  width: "100%",
});
