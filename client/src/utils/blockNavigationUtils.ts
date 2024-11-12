import { EditorNode } from "../types/markdown";

type NavigationDirection = 'prev' | 'next';

 // 에디터 노드 타입 체크를 위한 유틸리티 함수들
export const nodeTypeCheckers = {
  isCheckbox: (node?: EditorNode | null): boolean => node?.type === 'checkbox',
  isList: (node?: EditorNode | null): boolean => node?.type === 'ul' || node?.type === 'ol',
  isListItem: (node?: EditorNode | null): boolean => node?.type === 'li',
  isCheckboxChild: (node: EditorNode): boolean => nodeTypeCheckers.isCheckbox(node.parentNode),
};

 // 리스트 관련 유틸리티 함수들
export const listUtils = {
  getFirstListItem: (node: EditorNode) => node.firstChild,
  getLastListItem: (node: EditorNode) => {
    if (!node.firstChild) return null;
    
    let lastItem: EditorNode = node.firstChild;
    while (lastItem.nextSibling?.id) {
      lastItem = lastItem.nextSibling;
    }
    return lastItem;
  },
};

  // 체크박스 자식 노드의 이동 처리
const handleCheckboxChildNavigation = (
  currentNode: EditorNode, 
  direction: NavigationDirection
): EditorNode | null => {
  const parentCheckbox = currentNode.parentNode;
  const targetNode = direction === 'prev' ? parentCheckbox?.prevNode : parentCheckbox?.nextNode;
  
  if (!targetNode) return null;
  
  if (nodeTypeCheckers.isCheckbox(targetNode)) {
    return targetNode.firstChild ?? null;
  }
  
  if (nodeTypeCheckers.isList(targetNode)) {
    return direction === 'prev' 
      ? listUtils.getLastListItem(targetNode)
      : listUtils.getFirstListItem(targetNode);
  }
  
  return targetNode;
};

 // 리스트 아이템 노드의 이동 처리
const handleListItemNavigation = (
  currentNode: EditorNode, 
  direction: NavigationDirection
): EditorNode | null => {
  const sibling = direction === 'prev' ? currentNode.prevSibling : currentNode.nextSibling;
  
  if (sibling?.id) {
    return sibling;
  }
  
  const parentSibling = direction === 'prev'
    ? currentNode.parentNode?.prevNode
    : currentNode.parentNode?.nextNode;
  
  if (!parentSibling) return null;
  
  if (nodeTypeCheckers.isCheckbox(parentSibling)) {
    return parentSibling.firstChild ?? null;
  }
  
  return parentSibling;
};

 // 기본 블록 노드의 이동 처리
const handleBasicBlockNavigation = (
  currentNode: EditorNode, 
  direction: NavigationDirection
): EditorNode | null => {
  const targetNode = direction === 'prev' ? currentNode.prevNode : currentNode.nextNode;
  
  if (!targetNode) return null;
  
  if (nodeTypeCheckers.isCheckbox(targetNode)) {
    return targetNode.firstChild ?? null;
  }
  
  if (nodeTypeCheckers.isList(targetNode)) {
    return direction === 'prev'
      ? listUtils.getLastListItem(targetNode)
      : listUtils.getFirstListItem(targetNode);
  }
  
  return targetNode;
};

 // 키보드 네비게이션 핸들러 -> 현재 노드와 이동 방향을 받아 다음 타겟 노드를 반환
export const handleKeyNavigation = (
  currentNode: EditorNode, 
  direction: NavigationDirection
): EditorNode | null => {
  if (nodeTypeCheckers.isCheckboxChild(currentNode)) {
    return handleCheckboxChildNavigation(currentNode, direction);
  }
  
  if (nodeTypeCheckers.isListItem(currentNode)) {
    return handleListItemNavigation(currentNode, direction);
  }
  
  return handleBasicBlockNavigation(currentNode, direction);
};