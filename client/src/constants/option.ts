import { AnimationType, ElementType } from "@noctaCrdt/Interfaces";

export const OPTION_CATEGORIES = {
  TYPE: {
    id: "type",
    label: "전환",
    options: [
      { id: "p", label: "p" },
      { id: "h1", label: "h1" },
      { id: "h2", label: "h2" },
      { id: "h3", label: "h3" },
      { id: "ul", label: "ul" },
      { id: "ol", label: "ol" },
      { id: "checkbox", label: "checkbox" },
      { id: "blockquote", label: "blockquote" },
    ] as { id: ElementType; label: string }[],
  },
  ANIMATION: {
    id: "animation",
    label: "애니메이션",
    options: [
      { id: "none", label: "없음" },
      { id: "highlight", label: "하이라이트" },
      { id: "gradation", label: "그라데이션" },
    ] as { id: AnimationType; label: string }[],
  },
  DUPLICATE: {
    id: "duplicate",
    label: "복제",
    options: null,
  },
  DELETE: {
    id: "delete",
    label: "삭제",
    options: null,
  },
};

export type OptionCategory = keyof typeof OPTION_CATEGORIES;
