import { css, cx } from "@styled-system/css";
import { glassContainer } from "@styled-system/recipes";

export const sidebarContainer = cx(
  glassContainer({ border: "md", borderRadius: "right" }),
  css({
    display: "flex",
    gap: "lg",
    flexDirection: "column",
    width: "sidebar.width",
    height: "calc(100vh - 40px)",
    marginBlock: "20px",
  }),
);
export const navWrapper = css({
  display: "flex",
  gap: "md",
  flexDirection: "column",
  width: "100%",
});

export const plusIconBox = css({
  display: "flex",
  justifyContent: "start",
  paddingInline: "md",
});
