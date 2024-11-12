import { useCallback } from "react";
import { EditorNode } from "../../../types/markdown";
import { KeyHandlerProps } from "./handlerProps";

export const useEnterKeyHandler = ({
  editorState,
  editorList,
  setEditorState,
}: KeyHandlerProps) => {
  return useCallback(
    (e: React.KeyboardEvent) => {
      e.preventDefault();
      const { currentNode } = editorState;
      if (!currentNode) return;

      const selection = window.getSelection();
      const caretPosition = selection?.focusOffset || 0;
      const { content } = currentNode;

      const beforeText = content.slice(0, caretPosition);
      const afterText = content.slice(caretPosition);

      if (currentNode.type === "li") {
        const { parentNode } = currentNode;
        if (!parentNode) return;

        if (content.length === 0) {
          const isLastItem = currentNode.nextSibling === null;
          const newNode = editorList.createNode("p", "", null, null, 0);

          if (isLastItem) {
            // 마지막 아이템인 경우
            // 이전 형제 노드와의 연결 해제
            if (currentNode.prevSibling) {
              currentNode.prevSibling.nextSibling = null;
            } else {
              parentNode.firstChild = null;
            }

            // 새 노드와 부모 리스트 노드 사이의 연결 설정
            newNode.prevNode = parentNode;

            if (parentNode.nextNode) {
              newNode.nextNode = parentNode.nextNode;
              parentNode.nextNode.prevNode = newNode;
            }

            parentNode.nextNode = newNode;

            // 현재 노드 제거 전 연결 관계 정리
            if (currentNode.prevSibling) {
              currentNode.prevSibling.nextSibling = null;
            }
            if (currentNode.nextSibling) {
              currentNode.nextSibling.prevSibling = null;
            }

            editorList.removeNode(currentNode);
          } else {
            // 중간 아이템인 경우
            // 새로운 리스트 생성
            const newParentList = editorList.createNode(
              parentNode.type,
              "",
              null,
              null,
              parentNode.depth,
            );

            // 현재 노드의 다음 형제들을 새 리스트로 이동
            let sibling = currentNode.nextSibling;
            if (sibling) {
              newParentList.firstChild = sibling;
              let prevSibling = null;

              while (sibling) {
                const nextSibling = sibling.nextSibling as EditorNode | null;
                sibling.parentNode = newParentList;
                sibling.prevSibling = prevSibling;
                if (prevSibling) {
                  prevSibling.nextSibling = sibling;
                }
                prevSibling = sibling;
                sibling = nextSibling;
              }
            }

            // 이전 형제 노드와의 연결 해제
            if (currentNode.prevSibling) {
              currentNode.prevSibling.nextSibling = null;
            }

            // 원래 부모 리스트의 다음 노드 저장
            const originalNextNode = parentNode.nextNode;

            // 새로운 노드들 간의 연결 설정
            newNode.prevNode = parentNode;
            newNode.nextNode = newParentList;
            parentNode.nextNode = newNode;
            newParentList.prevNode = newNode;

            // 원래 다음 노드가 있었다면 연결 유지
            if (originalNextNode) {
              newParentList.nextNode = originalNextNode;
              originalNextNode.prevNode = newParentList;
            }

            // 현재 노드와 새 리스트의 관계 초기화
            currentNode.nextSibling = null;
            currentNode.prevSibling = null;
            currentNode.parentNode = null;

            // 현재 노드 제거
            editorList.removeNode(currentNode);
          }

          setEditorState((prev) => ({
            ...prev,
            currentNode: newNode,
          }));
        } else {
          // 텍스트가 있는 경우 새로운 li 추가
          currentNode.content = beforeText;
          const newNode = editorList.createNode("li", afterText, null, null, currentNode.depth);
          newNode.parentNode = parentNode;

          // siblings 관계 설정
          newNode.prevSibling = currentNode;
          if (currentNode.nextSibling) {
            newNode.nextSibling = currentNode.nextSibling;
            currentNode.nextSibling.prevSibling = newNode;
          }
          currentNode.nextSibling = newNode;

          setEditorState((prev) => ({
            ...prev,
            currentNode: newNode,
          }));
        }
      } else {
        // 현재 텍스트의 길이가 0이면 일반 블록으로 변경
        if (content.length === 0) {
          currentNode.type = "p";
          currentNode.content = "";
          setEditorState((prev) => ({
            ...prev,
            currentNode,
          }));
        } else {
          // 일반 블록은 항상 p 태그로 새 블록 생성
          currentNode.content = beforeText;
          const newNode = editorList.createNode("p", afterText, currentNode, currentNode.nextNode);

          // 연결 관계 설정
          if (currentNode.nextNode) {
            currentNode.nextNode.prevNode = newNode;
          }
          currentNode.nextNode = newNode;

          setEditorState((prev) => ({
            ...prev,
            currentNode: newNode,
          }));
        }
      }
    },
    [editorState, editorList, setEditorState],
  );
};
