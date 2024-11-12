import { useCallback } from "react";
import { EditorNode } from "../../../types/markdown";
import { KeyHandlerProps } from "./handlerProps";

export const useArrowKeyHandler = ({ editorState, editorList, setEditorState }: KeyHandlerProps) => {
  return useCallback(
    (e: React.KeyboardEvent) => {
      e.preventDefault();
      const { currentNode } = editorState;
      if (!currentNode) return;

      let targetNode: EditorNode | null = null;
      switch (e.key) {
        case "ArrowUp":
          if (currentNode.prevNode?.type === "ul" || currentNode.prevNode?.type === "ol") {
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
          if (currentNode.nextNode?.type === "ul" || currentNode.nextNode?.type === "ol") {
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