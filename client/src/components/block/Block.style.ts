import { css, cx } from "@styled-system/css";

// 기본 블록 스타일 정의
const baseBlockStyle = css({
  textStyle: "display-medium16",
  outline: "none",
  borderRadius: "radii.xs",
  width: "full",
  minHeight: "spacing.lg",
  margin: "spacing.sm 0",
  padding: "spacing.sm",
  color: "gray.700",
  backgroundColor: "transparent",
});

// 각 블록 타입별 스타일 정의
export const blockContainer = {
  base: baseBlockStyle,

  paragraph: baseBlockStyle,

  heading1: cx(
    baseBlockStyle,
    css({
      textStyle: "display-medium24",
      color: "gray.900",
      fontWeight: "bold",
    }),
  ),

  heading2: cx(
    baseBlockStyle,
    css({
      textStyle: "display-medium20",
      color: "gray.900",
      fontWeight: "bold",
    }),
  ),

  heading3: cx(
    baseBlockStyle,
    css({
      textStyle: "display-medium16",
      color: "gray.900",
      fontWeight: "bold",
    }),
  ),

  unorderedList: cx(
    baseBlockStyle,
    css({
      display: "block",
      listStyleType: "disc",
      listStylePosition: "inside",
    }),
  ),

  orderedList: cx(
    baseBlockStyle,
    css({
      display: "block",
      listStyleType: "decimal",
      listStylePosition: "inside",
    }),
  ),

  listItem: css({
    textStyle: "display-medium16",
    display: "list-item", // 리스트 아이템으로 표시되도록 설정
    outline: "none",
    margin: "0",
    padding: "0 0 0 spacing.md",
    color: "gray.700",
  }),

  input: css({
    textStyle: "display-medium16",
    margin: "spacing.sm 0",
  }),

  blockquote: cx(
    baseBlockStyle,
    css({
      borderLeft: "4px solid token(colors.gray.300)",
      paddingLeft: "spacing.md",
      color: "gray.500",
      fontStyle: "italic",
    }),
  ),
};
