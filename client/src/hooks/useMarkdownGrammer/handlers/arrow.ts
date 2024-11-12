import { useCallback } from "react";
import { EditorNode } from "../../../types/markdown";
import { KeyHandlerProps } from "./handlerProps";

export const useArrowKeyHandler = ({
  editorState,
  editorList,
  setEditorState,
}: KeyHandlerProps) => {
  return useCallback(
    (e: React.KeyboardEvent) => {
      e.preventDefault();
      const { currentNode } = editorState;
      if (!currentNode) return;

      let targetNode: EditorNode | null = null;
      
      switch (e.key) {
        case "ArrowUp":
          if (currentNode.parentNode?.type === "checkbox") {
            if (currentNode.parentNode.prevNode) {
              if (currentNode.parentNode.prevNode.type === "checkbox") {
                targetNode = currentNode.parentNode.prevNode.firstChild;
              } else {
                targetNode = currentNode.parentNode.prevNode;
              }
            }
          } else if (currentNode.prevNode?.type === "ul" || currentNode.prevNode?.type === "ol") {
            targetNode = editorList.getLastChild(currentNode.prevNode);
          } else if (currentNode.type === "li") {
            if (currentNode.prevSibling?.id) {
              targetNode = currentNode.prevSibling;
            } else {
              if (currentNode.parentNode?.prevNode) {
                if (currentNode.parentNode.prevNode.type === "checkbox") {
                  // 이전 블록이 체크박스인 경우 처리
                  targetNode = currentNode.parentNode.prevNode.firstChild;
                } else {
                  targetNode = currentNode.parentNode.prevNode;
                }
              } else {
                return;
              }
            }
          } else {
            targetNode = currentNode.prevNode;
          }
          break;
      
        case "ArrowDown":
          if (currentNode.parentNode?.type === "checkbox") {
            if (currentNode.parentNode.nextNode) {
              if (currentNode.parentNode.nextNode.type === "checkbox") {
                targetNode = currentNode.parentNode.nextNode.firstChild;
              } else {
                targetNode = currentNode.parentNode.nextNode;
              }
            }
          } else if (currentNode.nextNode?.type === "ul" || currentNode.nextNode?.type === "ol") {
            targetNode = currentNode.nextNode.firstChild;
          } else if (currentNode.type === "li") {
            if (currentNode.nextSibling?.id) {
              targetNode = currentNode.nextSibling;
            } else {
              if (currentNode.parentNode?.nextNode) {
                if (currentNode.parentNode.nextNode.type === "checkbox") {
                  // 다음 블록이 체크박스인 경우 처리
                  targetNode = currentNode.parentNode.nextNode.firstChild;
                } else {
                  targetNode = currentNode.parentNode.nextNode;
                }
              } else {
                return;
              }
            }
          } else {
            targetNode = currentNode.nextNode;
          }
          break;
      }
      
      /*
      switch (e.key) {
        case "ArrowUp":
          if (currentNode.parentNode?.type === "checkbox") {
            if (currentNode.parentNode.prevNode) {
              if (currentNode.parentNode.prevNode.type === "checkbox") {
                targetNode = currentNode.parentNode.prevNode.firstChild;
              } else {
                targetNode = currentNode.parentNode.prevNode;
              }
            }
          } else if (currentNode.prevNode?.type === "ul" || currentNode.prevNode?.type === "ol") {
            targetNode = editorList.getLastChild(currentNode.prevNode!);
          } else if (currentNode.type === "li") {
            if (currentNode.prevSibling?.id) {
              targetNode = currentNode.prevSibling;
            } else {
              if (currentNode.parentNode?.prevNode) {
                targetNode = currentNode.parentNode?.prevNode;
              } else return;
            }
          } else {
            targetNode = currentNode.prevNode;
          }
          break;
        case "ArrowDown":
          if (currentNode.parentNode?.type === "checkbox") {
            if (currentNode.parentNode.nextNode) {
              if (currentNode.parentNode.nextNode.type === "checkbox") {
                targetNode = currentNode.parentNode.nextNode.firstChild;
              } else {
                targetNode = currentNode.parentNode.nextNode;
              }
            }
            
          } else if (currentNode.nextNode?.type === "ul" || currentNode.nextNode?.type === "ol") {
            targetNode = currentNode.nextNode!.firstChild;
          } else if (currentNode.type === "li") {
            if (currentNode.nextSibling?.id) {
              targetNode = currentNode.nextSibling;
            } else {
              if (currentNode.parentNode?.nextNode) {
                targetNode = currentNode.parentNode?.nextNode;
              } else return;
            }
          } else {
            targetNode = currentNode.nextNode;
          }
          break;
      }
      */
      if (targetNode) {
        setEditorState((prev) => ({
          ...prev,
          currentNode: targetNode,
        }));
      }
    },
    [editorState, editorList, setEditorState],
  );
};
