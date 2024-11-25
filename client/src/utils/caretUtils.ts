import { BlockLinkedList, TextLinkedList } from "@noctaCrdt/LinkedList";
import { BlockId } from "@noctaCrdt/NodeId";

interface SetCaretPositionProps {
  blockId: BlockId;
  linkedList: BlockLinkedList | TextLinkedList;
  clientX?: number;
  clientY?: number;
  position?: number; // 특정 위치로 캐럿을 설정하고 싶을 때 사용
}

export const setCaretPosition = ({
  blockId,
  linkedList,
  clientX,
  clientY,
  position,
}: SetCaretPositionProps): boolean => {
  try {
    const selection = window.getSelection();
    if (!selection) return false;

    const blockElements = Array.from(
      document.querySelectorAll('.d_flex.pos_relative.w_full[data-group="true"]'),
    );
    const currentIndex = linkedList.spread().findIndex((b) => b.id === blockId);
    const targetElement = blockElements[currentIndex];
    if (!targetElement) return false;

    const editableDiv = targetElement.querySelector('[contenteditable="true"]') as HTMLDivElement;
    if (!editableDiv) return false;

    editableDiv.focus();

    let range: Range;

    if (clientX !== undefined && clientY !== undefined) {
      // 클릭 위치에 따른 캐럿 설정
      const clickRange = document.caretRangeFromPoint(clientX, clientY);
      if (!clickRange) return false;
      range = clickRange;
    } else if (position !== undefined) {
      // 특정 위치에 캐럿 설정
      range = document.createRange();
      const textNode =
        Array.from(editableDiv.childNodes).find((node) => node.nodeType === Node.TEXT_NODE) || null;
      if (!textNode) {
        // 텍스트 노드가 없으면 새로운 텍스트 노드를 추가
        const newTextNode = document.createTextNode("");
        editableDiv.appendChild(newTextNode);
        range.setStart(newTextNode, 0);
      } else {
        // position이 텍스트 길이를 초과하지 않도록 조정
        const safePosition = Math.min(position, textNode.textContent?.length || 0);
        range.setStart(textNode, safePosition);
      }

      range.collapse(true);
    } else {
      return false;
    }

    selection.removeAllRanges();
    selection.addRange(range);

    return true;
  } catch (error) {
    console.error("Error setting caret position:", error);
    return false;
  }
};
