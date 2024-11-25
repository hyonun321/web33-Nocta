/* eslint-disable @pandacss/no-dynamic-styling */
import { TextColorType } from "@noctaCrdt/Interfaces";
import { colors } from "@src/styles/tokens/color";
import { css, cva } from "@styled-system/css";
import { token } from "@styled-system/tokens";

type ColorVariants = {
  [K in TextColorType]: { color: string };
};

const colorVariants: ColorVariants = {
  black: { color: "#2B4158" },
  red: { color: "#F24150" },
  green: { color: "#1BBF44" },
  blue: { color: "#4285F4" },
  yellow: { color: "#FEA642" },
  purple: { color: "#A142FE" },
  brown: { color: "#8B4513" },
  white: { color: "#C1D7F4" },
};

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

export const colorOptionButton = css({
  width: "28px",
  height: "28px",
  margin: "0 2px",
  cursor: "pointer",
  _hover: {
    transform: "scale(1.1)",
  },
});

// 색상 표시 원형 스타일 베이스
const colorIndicatorBase = {
  width: "28px",
  height: "28px",
  borderRadius: "3px",
  transition: "all 0.2s",
};

// 텍스트 색상 indicator
export const textColorIndicator = cva({
  ...colorIndicatorBase,
  variants: {
    color: colorVariants,
  },
});

export const backgroundColorIndicator = cva({
  ...colorIndicatorBase,
  variants: {
    color: {
      black: {
        backgroundColor: `color-mix(in srgb, ${token("colors.gray.900")}, white 20%)`,
      },
      red: {
        backgroundColor: `color-mix(in srgb, ${token("colors.red")}, white 20%)`,
      },
      yellow: {
        backgroundColor: `color-mix(in srgb, ${token("colors.yellow")}, white 20%)`,
      },
      green: {
        backgroundColor: `color-mix(in srgb, ${token("colors.green")}, white 20%)`,
      },
      purple: {
        backgroundColor: `color-mix(in srgb, ${token("colors.purple")}, white 20%)`,
      },
      brown: {
        backgroundColor: `color-mix(in srgb, ${token("colors.brown")}, white 20%)`,
      },
      blue: {
        backgroundColor: `color-mix(in srgb, ${token("colors.blue")}, white 20%)`,
      },
      white: {
        backgroundColor: token("colors.white"),
      },
    },
  },
});
