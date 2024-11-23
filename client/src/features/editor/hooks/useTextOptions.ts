import { EditorCRDT } from "@noctaCrdt/Crdt";
import { RemoteBlockUpdateOperation, TextStyleType } from "@noctaCrdt/Interfaces";
import { Block, Char } from "@noctaCrdt/Node";
import { BlockId } from "@noctaCrdt/NodeId";
import { useCallback } from "react";
import { useSocketStore } from "@src/stores/useSocketStore";
import { EditorStateProps } from "../Editor";

interface UseTextOptionSelectProps {
  editorCRDT: EditorCRDT;
  setEditorState: React.Dispatch<React.SetStateAction<EditorStateProps>>;
  pageId: string;
  sendBlockUpdateOperation: (operation: RemoteBlockUpdateOperation) => void;
}

export const useTextOptionSelect = ({
  editorCRDT,
  setEditorState,
  pageId,
  sendBlockUpdateOperation,
}: UseTextOptionSelectProps) => {
  const { sendCharUpdateOperation } = useSocketStore();

  const handleStyleUpdate = useCallback(
    (styleType: TextStyleType, blockId: BlockId, nodes: Array<Char>) => {
      if (!nodes) return;

      nodes.forEach((node) => {
        const block = editorCRDT.LinkedList.getNode(blockId) as Block;
        if (!block) return;
        const char = block.crdt.LinkedList.getNode(node.id) as Char;
        if (!char) return;

        const toggleStyle = (style: TextStyleType) => {
          if (char.style.includes(style)) {
            char.style = char.style.filter((s) => s !== style);
          } else {
            char.style.push(style);
          }
        };

        switch (styleType) {
          case "bold":
            toggleStyle("bold");
            break;
          case "italic":
            toggleStyle("italic");
            break;
          case "underline":
            toggleStyle("underline");
            break;
          case "strikethrough":
            toggleStyle("strikethrough");
            break;
        }

        block.crdt.localUpdate(char, node.id, pageId);

        sendCharUpdateOperation({
          node: char,
          blockId,
          pageId,
        });
      });
      setEditorState({
        clock: editorCRDT.clock,
        linkedList: editorCRDT.LinkedList,
      });
    },
    [pageId, sendBlockUpdateOperation],
  );

  return {
    onTextStyleUpdate: handleStyleUpdate,
  };
};
