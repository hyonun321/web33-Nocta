import { css } from "@styled-system/css";

export const IntroScreenContainer = css({
  display: "flex",
  zIndex: 50,
  position: "fixed",
  inset: 0,
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  backgroundSize: "cover",
  transition: "opacity 0.5s ease-in-out",
});

export const topText = css({
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -160px)",
  width: "100%",
  color: "gray.900",
  textAlign: "center",
  fontSize: "2xl",
  opacity: 1,
  animation: "fadeIn",
  animationDelay: "0.5s",
});

export const bottomText = css({
  top: "50%",
  left: "50%",
  transform: "translate(-50%, 120px)",
  width: "100%",
  color: "gray.900",
  textAlign: "center",
  fontSize: "4xl",
  fontWeight: "bold",
  opacity: 1,
  animation: "",
  animationDelay: "0.5s",
});
