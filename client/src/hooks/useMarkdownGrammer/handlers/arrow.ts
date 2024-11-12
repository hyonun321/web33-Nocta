import { useCallback } from "react";
import { handleKeyNavigation } from "@utils/blockNavigationUtils";
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
        case "ArrowDown": {
          e.preventDefault();

          const direction = e.key === "ArrowUp" ? "prev" : "next";
          targetNode = handleKeyNavigation(currentNode, direction);

          break;
        }
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
