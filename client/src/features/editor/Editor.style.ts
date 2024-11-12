import { css } from "@styled-system/css";

export const editorContainer = css({
  width: "full",
  height: "full", // 부모 컴포넌트의 header(60px)를 제외한 높이
  margin: "spacing.lg", // 16px margin
  padding: "24px", // 24px padding
  overflowY: "auto", // 내용이 많을 경우 스크롤
  _focus: {
    outline: "none",
  },
  display: "flex",
  flexDirection: "column",
  gap: "spacing.sm",
});

export const editorTitleContainer = css({
  width: 'full',
  padding: 'spacing.sm',
  marginBottom: 'spacing.md',
  border: 'none',
  outline: 'none',
  textStyle: 'display-medium28',
  color: 'gray.700',
  backgroundColor: 'transparent',
  '&::placeholder': {
    color: 'gray.300'
  }
})