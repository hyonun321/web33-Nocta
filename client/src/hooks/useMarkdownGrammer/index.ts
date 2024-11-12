import { useCallback } from "react";
import { KeyHandlerProps } from "./handlers/handlerProps";
import { useSpaceKeyHandler } from "./handlers/space";
import { useBackspaceKeyHandler } from "./handlers/backSpace";
import { useEnterKeyHandler } from "./handlers/enter";
import { useArrowKeyHandler } from "./handlers/arrow";

export const useKeyboardHandlers = (props: KeyHandlerProps) => {
  const handleEnter = useEnterKeyHandler(props);
  const handleSpace = useSpaceKeyHandler(props);
  const handleBackspace = useBackspaceKeyHandler(props);
  const handleArrow = useArrowKeyHandler(props);
  // const handleTab = useTabKeyHandler(props);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "Enter":
          if (!e.shiftKey) handleEnter(e);
          break;
        case " ":
          handleSpace(e);
          break;
        case "Backspace":
          handleBackspace(e);
          break;
        case "ArrowUp":
        case "ArrowDown":
          handleArrow(e);
          break;
        case "Tab":
          /*
          handleTab(e);
          */
          break;
      }
    },
    [handleEnter, handleSpace, handleBackspace, handleArrow],
  );

  return { handleKeyDown };
};


/*
const useTabKeyHandler = ({ editorState, editorList, setEditorState }: KeyHandlerProps) => {
  return useCallback(
    (e: React.KeyboardEvent) => {
      e.preventDefault();
      const { currentNode } = editorState;
      if (!currentNode) return;

      if (currentNode.type === "li") {
        if (e.shiftKey) {
          // 들여쓰기 감소
          if (currentNode.depth > 1) {
            editorList.decreaseIndent(currentNode);

            // 형제 노드들의 depth도 함께 조정
            let sibling = currentNode.nextSibling;
            while (sibling) {
              editorList.decreaseIndent(sibling);
              sibling = sibling.nextSibling;
            }
          }
        } else {
          // 들여쓰기 증가
          if (currentNode.prevSibling) {
            // 첫 번째 아이템이 아닌 경우만
            editorList.increaseIndent(currentNode);

            // 형제 노드들의 depth도 함께 조정
            let sibling = currentNode.nextSibling;
            while (sibling) {
              editorList.increaseIndent(sibling);
              sibling = sibling.nextSibling;
            }
          }
        }
      }

      setEditorState((prev) => ({ ...prev }));
    },
    [editorState, editorList, setEditorState],
  );
};
*/