import { SIDE_BAR } from "@constants/size";
import { css } from "@styled-system/css";

export const menuItemWrapper = css({
  display: "flex",
  gap: "md",
  alignItems: "center",
  width: "100%",
  padding: "md",
  cursor: "pointer",
});

export const textBox = css({
  color: "gray.700",
  fontSize: "md",
});

export const menuButtonContainer = css({
  position: "relative",
  // 버튼과 모달 사이의 간격을 채우는 패딩 추가
  _before: {
    position: "absolute",
    top: "100%",
    left: 0,
    width: "100%",
    height: "4px", // top: calc(100% + 4px)와 동일한 값
    content: '""',
  },
});
