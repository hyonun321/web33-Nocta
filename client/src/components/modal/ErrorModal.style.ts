import { css } from "@styled-system/css";

export const modalWrapper = css({
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  width: "500px",
  minHeight: "400px",
  padding: "40px",
});

export const overlay = css({
  display: "flex",
  position: "fixed",
  inset: 0,
  justifyContent: "center",
  alignItems: "center",
});

export const content = css({
  display: "flex",
  gap: "4",
  flexDirection: "column",
  alignItems: "center",
  textAlign: "center",
});

export const title = css({
  color: "gray.700",
  fontSize: "xl",
  fontWeight: "bold",
});

export const message = css({
  color: "red.500",
  fontSize: "sm",
});

export const animationContainer = css({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  width: "200px",
  height: "200px",
  margin: "0 auto",
  marginBottom: "4",
});
