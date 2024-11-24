import { Block } from "@noctaCrdt/Node";

interface SetInnerHTMLProps {
  element: HTMLDivElement;
  block: Block;
}

const getHtmlTag = (style: string): string => {
  const tagMappings: Record<string, string> = {
    bold: "b", // bold는 <b>
    italic: "i", // italic은 <i>
    underline: "u", // underline은 <u>
    strikethrough: "s", // strikethrough는 <s>
  };
  return tagMappings[style] || "span"; // 기본은 <span>
};

export const setInnerHTML = ({ element, block }: SetInnerHTMLProps): void => {
  const chars = block.crdt.LinkedList.spread();
  if (chars.length === 0) {
    element.innerHTML = "";
    return;
  }

  // 각 위치별 모든 적용된 스타일을 추적
  const positionStyles: Set<string>[] = chars.map((char, index) => {
    const styleSet = new Set<string>();

    // 해당 위치에 적용되어야 하는 모든 스타일 수집
    chars.forEach((c, i) => {
      if (i === index) {
        c.style.forEach((style) => styleSet.add(style));
      }
    });

    return styleSet;
  });

  let html = "";
  let currentStyles = new Set<string>();

  chars.forEach((char, index) => {
    const targetStyles = positionStyles[index];

    // 제거해야 할 스타일 (현재는 있지만 다음에는 필요 없는 스타일)
    const stylesToRemove = [...currentStyles].filter((style) => !targetStyles.has(style));

    // 추가해야 할 스타일 (현재는 없지만 다음에는 필요한 스타일)
    const stylesToAdd = [...targetStyles].filter((style) => !currentStyles.has(style));

    // 제거할 스타일 태그 닫기 (역순으로)
    stylesToRemove.reverse().forEach((style) => {
      html += `</${getHtmlTag(style)}>`;
    });

    // 새로운 스타일 태그 열기
    stylesToAdd.forEach((style) => {
      html += `<${getHtmlTag(style)}>`;
    });

    // 텍스트 추가
    html += sanitizeText(char.value);

    // 다음 문자로 넘어가기 전에 현재 스타일 상태 업데이트
    currentStyles = new Set(targetStyles);

    // 마지막 문자이거나 다음 문자와 스타일이 다른 경우
    if (index === chars.length - 1 || !setsEqual(targetStyles, positionStyles[index + 1])) {
      // 현재 열려있는 모든 태그 닫기
      [...currentStyles].reverse().forEach((style) => {
        html += `</${getHtmlTag(style)}>`;
      });
      currentStyles.clear();
    }
  });

  // DOM 업데이트
  if (element.innerHTML !== html) {
    element.innerHTML = html;
  }
};

// Set 비교 헬퍼 함수
const setsEqual = (a: Set<string>, b: Set<string>): boolean => {
  if (a.size !== b.size) return false;
  for (const item of a) {
    if (!b.has(item)) return false;
  }
  return true;
};

const sanitizeText = (text: string): string => {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

// 배열 비교 헬퍼 함수
export const arraysEqual = (a: string[], b: string[]): boolean => {
  if (a.length !== b.length) return false;
  return a.sort().every((val, idx) => val === b.sort()[idx]);
};
