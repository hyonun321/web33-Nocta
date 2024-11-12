import { cva } from "@styled-system/css";

// 기본 블록 스타일
const baseBlockStyle = {
  textStyle: "display-medium16",
  outline: "none",
  borderRadius: "radii.xs",
  width: "full",
  minHeight: "spacing.lg",
  margin: "spacing.sm 0",
  padding: "spacing.sm",
  color: "gray.900",
  backgroundColor: "transparent",
  "&:empty::before": {
    content: "attr(data-placeholder)", // data-placeholder 속성의 값을 표시
    color: "gray.300",
    position: "absolute",
    pointerEvents: "none", // 텍스트 선택이나 클릭 방지
  },
};

// 블록 타입별 스타일 variants
export const blockContainerStyle = cva({
  base: baseBlockStyle,
  variants: {
    type: {
      p: {
        textStyle: "display-medium16",
        fontWeight: "bold",
      },
      h1: {
        textStyle: "display-medium24",
        fontWeight: "bold",
      },
      h2: {
        textStyle: "display-medium20",
        fontWeight: "bold",
      },
      h3: {
        textStyle: "display-medium16",
        fontWeight: "bold",
      },
      ul: {
        display: "block",
        listStyleType: "disc",
        listStylePosition: "inside",
      },
      ol: {
        display: "block",
        listStyleType: "decimal",
        listStylePosition: "inside",
      },
      li: {
        textStyle: "display-medium16",
        display: "list-item",
        outline: "none",
        margin: "0",
        padding: "0 0 0 spacing.md",
      },
      blockquote: {
        borderLeft: "4px solid token(colors.gray.300)",
        paddingLeft: "spacing.md",
        color: "gray.500",
        fontStyle: "italic",
      },
      input: {},
    },
    isActive: {
      true: {
        opacity: 0.9,
      },
      false: {
        backgroundColor: "transparent",
      },
    },
  },
  defaultVariants: {
    type: "p",
    isActive: false,
  },
});
