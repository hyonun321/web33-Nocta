import { useCallback, useRef } from "react";

export const useCaretManager = () => {
  const caretRangeRef = useRef<Range | null>(null);

  // 커서 위치 저장 함수
  const saveCaretPosition = useCallback(() => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      caretRangeRef.current = selection.getRangeAt(0);
    }
  }, []);

  // 커서 위치 복원 함수
  const restoreCaretPosition = useCallback(() => {
    const selection = window.getSelection();
    if (selection && caretRangeRef.current) {
      selection.removeAllRanges();
      selection.addRange(caretRangeRef.current);
    }
  }, []);

  // 커서 위치 설정 함수
  const setCaretPosition = useCallback((element: HTMLElement | null, position: number = 0) => {
    if (!element) return;

    const selection = window.getSelection();
    if (!selection) return;

    selection.removeAllRanges();

    const range = document.createRange();

    let textNode: Text;
    if (element.firstChild && element.firstChild.nodeType === Node.TEXT_NODE) {
      textNode = element.firstChild as Text;
    } else {
      textNode = document.createTextNode(element.textContent || "");
      element.appendChild(textNode);
    }

    const actualPosition = Math.min(position, textNode.length);

    range.setStart(textNode, actualPosition);
    range.collapse(true);

    selection.addRange(range);
    element.focus();
  }, []);

  return { saveCaretPosition, restoreCaretPosition, setCaretPosition };
};
