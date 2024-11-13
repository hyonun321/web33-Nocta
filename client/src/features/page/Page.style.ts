import { css, cx } from "@styled-system/css";
import { glassContainer } from "@styled-system/recipes";

export const pageContainer = cx(
  glassContainer({ border: "lg" }),
  css({
    position: "absolute",
    width: "450px",
    height: "400px",
  }),
);

export const pageHeader = css({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  borderTopRadius: "md",
  height: "60px",
  padding: "sm",
  boxShadow: "xs",
  backdropFilter: "blur(30px)",
  "&:hover": {
    cursor: "move",
  },
});

export const pageTitle = css({
  textStyle: "display-medium24",
  color: "gray.500",
});

export const resizeHandle = css({
  position: "absolute",
  right: "-10px",
  bottom: "-10px",
  width: "32px",
  height: "32px",
  cursor: "se-resize",
});
