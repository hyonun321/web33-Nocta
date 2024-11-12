import { useCallback } from "react";
import { KeyHandlerProps } from "./handlerProps";

export const useSpaceKeyHandler = ({
  editorState,
  editorList,
  setEditorState,
  checkMarkdownPattern,
}: KeyHandlerProps) => {
  return useCallback(
    (e: React.KeyboardEvent) => {
      if (editorState.currentNode?.type !== "p") return;
      const text = (e.target as HTMLElement).textContent || "";
      const newElement = checkMarkdownPattern(text);

      if (newElement) {
        e.preventDefault();
        const { currentNode } = editorState;
        if (!currentNode) return;
        if (newElement.type === "checkbox") {
          const { prevNode, nextNode } = currentNode;
          const wasRoot = currentNode.prevNode === null;

          // checkbox-container 노드 생성
          const containerNode = editorList.createNode(
            "checkbox",
            "",
            prevNode,
            nextNode,
            currentNode.depth,
          );

          // content 노드 생성
          const contentNode = editorList.createNode("p", "", null, null, currentNode.depth + 1);

          // 노드 간 관계 설정
          containerNode.firstChild = contentNode;
          contentNode.parentNode = containerNode;

          // checkbox 속성 설정
          containerNode.attributes = {
            checked: false,
            ...newElement.attributes,
          };

          // root 노드 업데이트
          if (wasRoot) {
            editorList.root = containerNode;
          } else {
            if (prevNode) prevNode.nextNode = containerNode;
            if (nextNode) nextNode.prevNode = containerNode;
          }

          setEditorState((prev) => ({
            ...prev,
            rootNode: wasRoot ? containerNode : prev.rootNode,
            currentNode: contentNode,
          }));
        } else if (newElement.type === "ul" || newElement.type === "ol") {
          // 기존 노드의 위치 관계 저장
          const { prevNode, nextNode } = currentNode;
          const wasRoot = currentNode.prevNode === null;
          const parentListNode = editorList.createNode(newElement.type, "", prevNode, nextNode);
          const listNode = editorList.createNode("li", "", null, null, 1);
          parentListNode.firstChild = listNode;
          listNode.parentNode = parentListNode;
          // root 노드 업데이트
          if (wasRoot) {
            editorList.root = parentListNode;
          } else {
            if (prevNode) {
              prevNode.nextNode = parentListNode;
            }
            if (nextNode) {
              nextNode.prevNode = parentListNode;
            }
          }

          setEditorState((prev) => ({
            ...prev,
            rootNode: wasRoot ? parentListNode : prev.rootNode,
            currentNode: listNode,
          }));
        } else {
          const wasRoot = currentNode.prevNode === null;
          const { prevNode, nextNode } = currentNode;
          // 기존 노드의 타입만 변경
          currentNode.type = newElement.type;
          currentNode.content = "";

          if (wasRoot) {
            editorList.root = currentNode;
          } else {
            if (prevNode) {
              prevNode.nextNode = currentNode;
            }
            if (nextNode) {
              nextNode.prevNode = currentNode;
            }
          }

          setEditorState((prev) => ({ ...prev }));
        }
      }
    },
    [editorState, editorList, checkMarkdownPattern, setEditorState],
  );
};
