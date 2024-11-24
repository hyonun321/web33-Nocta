import { BlockLinkedList, TextLinkedList } from "@noctaCrdt/LinkedList";
import { BlockId } from "@noctaCrdt/NodeId";

interface SetCaretPositionProps {
  blockId: BlockId;
  linkedList: BlockLinkedList | TextLinkedList;
  position?: number; // 특정 위치로 캐럿을 설정하고 싶을 때 사용
}

export const setCaretPosition = ({
  blockId,
  linkedList,
  position,
}: SetCaretPositionProps): void => {
  try {
    if (position === undefined) return;
    const selection = window.getSelection();
    if (!selection) return;

    const blockElements = Array.from(
      document.querySelectorAll('.d_flex.pos_relative.w_full[data-group="true"]'),
    );
    const currentIndex = linkedList.spread().findIndex((b) => b.id === blockId);
    const targetElement = blockElements[currentIndex];
    if (!targetElement) return;

    const editableDiv = targetElement.querySelector('[contenteditable="true"]') as HTMLDivElement;
    if (!editableDiv) return;

    editableDiv.focus();

    const range = document.createRange();
    const textNodes = Array.from(editableDiv.childNodes).filter(
      (node) => node.nodeType === Node.TEXT_NODE,
    );

    let currentPosition = 0;
    let targetNode: Node | null = null;
    let targetOffset = 0;

    for (const node of textNodes) {
      const textContent = node.textContent || "";
      if (currentPosition + textContent.length >= position) {
        targetNode = node;
        targetOffset = position - currentPosition;
        break;
      }
      currentPosition += textContent.length;
    }

    if (!targetNode) {
      targetNode = editableDiv;
      targetOffset = editableDiv.childNodes.length;
    }

    range.setStart(targetNode, targetOffset);
    range.collapse(true);

    selection.removeAllRanges();
    selection.addRange(range);
  } catch (error) {
    console.error("Error setting caret position:", error);
    return;
  }
};

/*
export const getAbsoluteCaretPosition = (element: HTMLElement): number => {
  const selection = window.getSelection();
  if (!selection?.focusNode) return 0;

  // 스타일 태그 내부의 텍스트 노드도 포함하여 모든 텍스트 노드 수집
  const collectTextNodesAndOffsets = (root: Node): { node: Text; offset: number }[] => {
    const nodes: { node: Text; offset: number }[] = [];
    let currentOffset = 0;

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    let node = walker.nextNode();

    while (node) {
      if (node.nodeType === Node.TEXT_NODE && node.nodeValue !== "\n") {
        nodes.push({
          node: node as Text,
          offset: currentOffset,
        });
        currentOffset += node.nodeValue?.length || 0;
      }
      node = walker.nextNode();
    }

    return nodes;
  };

  const textNodesWithOffsets = collectTextNodesAndOffsets(element);

  // focusNode가 텍스트 노드인 경우
  if (selection.focusNode.nodeType === Node.TEXT_NODE) {
    const focusTextNode = selection.focusNode as Text;
    const nodeInfo = textNodesWithOffsets.find((info) => info.node === focusTextNode);
    if (nodeInfo) {
      return nodeInfo.offset + selection.focusOffset;
    }
  }

  // focusNode가 element인 경우 (모든 텍스트가 삭제된 경우)
  if (selection.focusNode === element) {
    if (textNodesWithOffsets.length === 0) {
      return 0;
    }
    // 마지막 텍스트 노드의 끝 위치 반환
    const lastNode = textNodesWithOffsets[textNodesWithOffsets.length - 1];
    return lastNode.offset + lastNode.node.length;
  }

  return 0;
};
*/

export const getAbsoluteCaretPosition = (element: HTMLElement): number => {
  const selection = window.getSelection();
  if (!selection?.focusNode) return 0;

  const collectTextNodesAndOffsets = (
    root: Node,
  ): {
    node: Text | Node;
    offset: number;
    length: number;
  }[] => {
    const nodes: { node: Text | Node; offset: number; length: number }[] = [];
    let currentOffset = 0;

    // 모든 노드를 순회하면서 텍스트 노드와 그 부모 노드의 정보 수집
    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
      null,
    );

    let node = walker.nextNode();
    while (node) {
      if (node.nodeType === Node.TEXT_NODE && node.nodeValue !== "\n") {
        nodes.push({
          node,
          offset: currentOffset,
          length: node.nodeValue?.length || 0,
        });
        currentOffset += node.nodeValue?.length || 0;
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        // 요소 노드도 추적
        nodes.push({
          node,
          offset: currentOffset,
          length: node.textContent?.length || 0,
        });
      }
      node = walker.nextNode();
    }

    return nodes;
  };

  const textNodesWithOffsets = collectTextNodesAndOffsets(element);
  // focusNode가 텍스트 노드인 경우
  if (selection.focusNode.nodeType === Node.TEXT_NODE) {
    const focusTextNode = selection.focusNode;
    const nodeInfo = textNodesWithOffsets.find((info) => info.node === focusTextNode);
    if (nodeInfo) {
      return nodeInfo.offset + selection.focusOffset;
    }
  }

  // focusNode가 요소 노드인 경우 (스타일 태그 등)
  if (selection.focusNode.nodeType === Node.ELEMENT_NODE) {
    const focusElement = selection.focusNode;

    // 현재 요소의 모든 이전 텍스트 길이 계산
    let totalOffset = 0;
    for (const nodeInfo of textNodesWithOffsets) {
      if (nodeInfo.node === focusElement || focusElement.contains(nodeInfo.node)) {
        if (nodeInfo.node === focusElement) {
          return totalOffset + selection.focusOffset;
        }
        // focusOffset이 요소 내부의 특정 위치를 가리키는 경우
        if (
          selection.focusOffset > 0 &&
          nodeInfo.offset + nodeInfo.length >= selection.focusOffset
        ) {
          return nodeInfo.offset + selection.focusOffset;
        }
      }
      totalOffset += nodeInfo.length;
    }
    return totalOffset;
  }

  // focusNode가 element 자체인 경우 (빈 블록이나 모든 텍스트가 삭제된 경우)
  if (selection.focusNode === element) {
    // 선택된 오프셋까지의 모든 텍스트 길이 합산
    let totalOffset = 0;
    for (const nodeInfo of textNodesWithOffsets) {
      if (nodeInfo.offset < selection.focusOffset) {
        totalOffset += nodeInfo.length;
      }
    }
    return totalOffset;
  }

  return 0;
};
