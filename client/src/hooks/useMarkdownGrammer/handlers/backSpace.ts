import { useCallback } from "react";
import { EditorNode } from "../../../types/markdown";
import { KeyHandlerProps } from "./handlerProps";

export const useBackspaceKeyHandler = ({
  editorState,
  editorList,
  setEditorState,
}: KeyHandlerProps) => {
  return useCallback(
    (e: React.KeyboardEvent) => {
      const { currentNode } = editorState;
      if (!currentNode || currentNode.content.length > 0) return;
      if (currentNode === editorState.rootNode && currentNode.type === "p") return;
      e.preventDefault();
      if (currentNode.parentNode?.type === "checkbox") {
        const { parentNode } = currentNode;
        const wasRoot = parentNode === editorState.rootNode;

        let focusNode: EditorNode;

        if (parentNode.prevNode?.type === "checkbox") {
          // undefined가 될 수 있는 상황 체크
          const prevFirstChild = parentNode.prevNode.firstChild;
          if (!prevFirstChild) return;
          focusNode = prevFirstChild;
        } else {
          focusNode = editorList.createNode("p", "", parentNode.prevNode, parentNode.nextNode);

          // 포인터 관계 설정
          if (parentNode.prevNode) {
            parentNode.prevNode.nextNode = focusNode;
          }
          if (parentNode.nextNode) {
            parentNode.nextNode.prevNode = focusNode;
          }

          if (wasRoot) {
            editorList.root = focusNode;
          }
        }

        // 관계 정리 순서 변경
        // 1. 기존 연결 관계 정리
        if (parentNode.nextNode) {
          parentNode.nextNode.prevNode = parentNode.prevNode;
        }
        if (parentNode.prevNode) {
          parentNode.prevNode.nextNode = parentNode.nextNode;
        }

        // 2. 부모-자식 관계 정리
        currentNode.parentNode = null;
        parentNode.firstChild = null;

        // 3. 마지막으로 현재 노드의 관계 정리
        parentNode.prevNode = null;
        parentNode.nextNode = null;

        // 노드 제거
        editorList.removeNode(currentNode);
        editorList.removeNode(parentNode);

        setEditorState((prev) => ({
          ...prev,
          rootNode: wasRoot ? focusNode : prev.rootNode,
          currentNode: focusNode,
        }));
      } else if (currentNode.type === "li") {
        const { parentNode } = currentNode;
        if (!parentNode) return;

        const isLastItem = parentNode.firstChild === currentNode;

        if (isLastItem) {
          // 리스트를 p 태그로 변환
          const newNode = {
            ...currentNode,
            type: "p",
            content: "",
            prevNode: parentNode.prevNode,
            nextNode: parentNode.nextNode,
          } as EditorNode;
          if (parentNode.prevNode) {
            editorList.insertAfter(newNode, parentNode.prevNode);
            editorList.removeNode(parentNode);
            editorList.removeNode(currentNode);
          } else {
            newNode.prevNode = null;
            newNode.nextNode = parentNode.nextNode;
            editorList.insertAfter(newNode, parentNode);
            editorList.removeNode(parentNode);
            editorList.removeNode(currentNode);
          }

          // 연결 관계 설정
          if (parentNode.prevNode) {
            parentNode.prevNode.nextNode = newNode;
          }

          // root 노드 업데이트
          if (parentNode === editorState.rootNode) {
            editorList.root = newNode;
          }

          setEditorState((prev) => ({
            ...prev,
            rootNode: parentNode === prev.rootNode ? newNode : prev.rootNode,
            currentNode: newNode,
          }));
          editorList.current = newNode;
        } else {
          if (currentNode.nextSibling?.id) {
            const newNode = {
              ...currentNode,
              type: "p",
              content: "",
              parentNode: null,
              prevNode: parentNode.prevNode,
              nextNode: parentNode.nextNode,
            } as EditorNode;
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
                sibling = nextSibling!;
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
            setEditorState((prev) => ({
              ...prev,
              currentNode: newNode,
            }));
          } else {
            // 리스트 아이템 제거
            const focusNode = currentNode.prevSibling || currentNode.parentNode;
            editorList.removeNode(currentNode);

            setEditorState((prev) => ({
              ...prev,
              currentNode: focusNode,
            }));
          }
        }
      } else {
        if (currentNode.type !== "p") {
          // 기본 p 태그로 변환
          currentNode.type = "p";
          setEditorState((prev) => ({ ...prev }));
        } else {
          let focusNode: EditorNode;
          if (currentNode.prevNode?.type === "checkbox") {
            // 이전 노드가 체크박스면 그 체크박스의 content 노드로 포커스
            focusNode = currentNode.prevNode.firstChild as EditorNode;
          } else if (currentNode.prevNode?.type === "ul" || currentNode.prevNode?.type === "ol") {
            focusNode = editorList.getLastChild(currentNode.prevNode) as EditorNode;
          } else {
            focusNode = (currentNode.prevNode || currentNode.parentNode) as EditorNode;
          }

          // 현재 노드 제거 전에 연결 관계 정리
          if (currentNode.prevNode) {
            currentNode.prevNode.nextNode = currentNode.nextNode;
          }
          if (currentNode.nextNode) {
            currentNode.nextNode.prevNode = currentNode.prevNode;
          }

          editorList.removeNode(currentNode);

          if (focusNode === editorState.rootNode) {
            editorList.root = focusNode;
          }

          setEditorState((prev) => ({
            ...prev,
            rootNode: currentNode === prev.rootNode ? focusNode : prev.rootNode,
            currentNode: focusNode,
          }));
        }
      }
    },
    [editorState, editorList, setEditorState],
  );
};
