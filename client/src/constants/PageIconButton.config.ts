import { PageIconType } from "@noctaCrdt/Interfaces";
import { IconType } from "react-icons";
import {
  // 기본 문서 타입
  RiFileTextLine, // docs: 일반 문서
  RiStickyNoteLine, // note: 필기/메모
  RiBookReadLine, // wiki: 지식 베이스

  // 업무 관련
  RiProjectorLine, // project: 프로젝트
  RiTeamLine, // meeting: 회의록
  RiTaskLine, // task: 할일/작업

  // 개인 활동
  RiBookMarkedLine, // diary: 일기/저널
  RiQuillPenLine, // blog: 블로그
  RiYoutubeLine, // entertain: 엔터테인먼트

  // 학습 관련
  RiBookOpenLine, // study: 학습
  RiSearchLine, // research: 연구/조사
  RiBookLine, // book: 독서

  // 협업 관련
  RiGroupLine, // team: 팀 문서
  RiShareLine, // shared: 공유 문서
  RiDiscussLine, // feedback: 피드백
  RiAddFill, // plus: 추가
} from "react-icons/ri";

export interface IconConfig {
  icon: IconType;
  color: string;
}

export const iconComponents: Record<PageIconType | "plus", IconConfig> = {
  // 기본 문서 타입
  Docs: {
    icon: RiFileTextLine,
    color: "#2B4158",
  },
  Note: {
    icon: RiStickyNoteLine,
    color: "#FEA642", // YELLOW - 메모는 노란색
  },
  Wiki: {
    icon: RiBookReadLine,
    color: "#A142FE", // PURPLE - 위키는 보라색
  },

  // 업무 관련
  Project: {
    icon: RiProjectorLine,
    color: "#1BBF44", // GREEN - 프로젝트는 초록색
  },
  Meeting: {
    icon: RiTeamLine,
    color: "#4E637C", // GRAY_700 - 회의는 진중한 느낌의 회색
  },
  Task: {
    icon: RiTaskLine,
    color: "#F24150", // RED - 태스크는 주목성 높은 빨간색
  },

  // 개인 활동
  Diary: {
    icon: RiBookMarkedLine,
    color: "#FF69B4", // 연한 분홍색 - 개인적/감성적인 느낌
  },
  Blog: {
    icon: RiQuillPenLine,
    color: "#99AFCA", // GRAY_300 - 글쓰기는 차분한 회색
  },
  Entertain: {
    icon: RiYoutubeLine,
    color: "#F24150", // RED - 엔터테인먼트는 활동적인 빨간색
  },

  // 학습 관련
  Study: {
    icon: RiBookOpenLine,
    color: "#4285F4", // BLUE - 학습은 신뢰감 있는 파란색
  },
  Research: {
    icon: RiSearchLine,
    color: "#2B4158", // GRAY_900 - 연구는 깊이 있는 진한 회색
  },
  Book: {
    icon: RiBookLine,
    color: "#8B4513", // BROWN - 독서는 책을 연상시키는 갈색
  },

  // 협업 관련
  Team: {
    icon: RiGroupLine,
    color: "#1BBF44", // GREEN - 팀워크는 긍정적인 초록색
  },
  Shared: {
    icon: RiShareLine,
    color: "#4285F4", // BLUE - 공유는 소통을 의미하는 파란색
  },
  Feedback: {
    icon: RiDiscussLine,
    color: "#A142FE", // PURPLE - 피드백은 창의적인 보라색
  },

  plus: {
    icon: RiAddFill,
    color: "#2B4158",
  },
};

export const iconGroups = [
  {
    title: "기본 문서",
    icons: ["Docs", "Note", "Wiki"] as PageIconType[],
  },
  {
    title: "업무 관련",
    icons: ["Project", "Meeting", "Task"] as PageIconType[],
  },
  {
    title: "개인 활동",
    icons: ["Diary", "Blog", "Entertain"] as PageIconType[],
  },
  {
    title: "학습 관련",
    icons: ["Study", "Research", "Book"] as PageIconType[],
  },
  {
    title: "협업 관련",
    icons: ["Team", "Shared", "Feedback"] as PageIconType[],
  },
];
