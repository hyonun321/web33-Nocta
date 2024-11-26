import { defineGlobalStyles } from "@pandacss/dev";

export const globalStyles = defineGlobalStyles({
  body: {
    backgroundImage: 'url("./assets/images/background.png")',
    backgroundSize: "cover",
    // TODO 폰트 설정
  },

  // 스크롤바 전체
  "::-webkit-scrollbar": {
    width: "8px",
  },

  // 스크롤바 전체 영역
  "::-webkit-scrollbar-track": {
    background: "transparent",
    marginBottom: "12px",
  },

  // 스크롤바 핸들
  "::-webkit-scrollbar-thumb": {
    background: "white/50",
    borderRadius: "lg",
  },

  "input:-webkit-autofill": {
    transition: "background-color 5000s ease-in-out 0s",
  },
});
