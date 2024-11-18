import { css } from "@styled-system/css";

export const IntroScreenContainer = css({
  display: "flex",
  zIndex: 50,
  position: "fixed",
  inset: 0,
  justifyContent: "center",
  alignItems: "center",
  backgroundImage: "linear-gradient(135deg, gray, green)",
  backgroundSize: "cover",
  transition: "opacity 0.5s ease-in-out",
});
