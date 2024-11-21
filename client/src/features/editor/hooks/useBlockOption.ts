import { EditorCRDT } from "@noctaCrdt/Crdt";
import {
  AnimationType,
  ElementType,
  RemoteBlockDeleteOperation,
  RemoteBlockInsertOperation,
  RemoteBlockUpdateOperation,
} from "@noctaCrdt/Interfaces";
import { BlockId } from "@noctaCrdt/NodeId";
import { BlockLinkedList } from "node_modules/@noctaCrdt/LinkedList";
import { EditorStateProps } from "../Editor";

interface useBlockOptionSelectProps {
  editorCRDT: EditorCRDT;
  editorState: EditorStateProps;
  setEditorState: React.Dispatch<
    React.SetStateAction<{
      clock: number;
      linkedList: BlockLinkedList;
      currentBlock: BlockId | null;
    }>
  >;
  pageId: string;
  sendBlockUpdateOperation: (operation: RemoteBlockUpdateOperation) => void;
  sendBlockDeleteOperation: (operation: RemoteBlockDeleteOperation) => void;
  sendBlockInsertOperation: (operation: RemoteBlockInsertOperation) => void;
}

export const useBlockOptionSelect = ({
  editorCRDT,
  editorState,
  setEditorState,
  pageId,
  sendBlockUpdateOperation,
}: useBlockOptionSelectProps) => {
  const handleTypeSelect = (blockId: BlockId, type: ElementType) => {
    const block = editorState.linkedList.getNode(blockId);
    if (!block) return;

    block.type = type;
    editorCRDT.remoteUpdate(block, pageId);

    sendBlockUpdateOperation({
      node: block,
      pageId,
    });

    setEditorState((prev) => ({
      clock: editorCRDT.clock,
      linkedList: editorCRDT.LinkedList,
      currentBlock: blockId || prev.currentBlock,
    }));
  };

  const handleAnimationSelect = (blockId: BlockId, animation: AnimationType) => {
    const block = editorState.linkedList.getNode(blockId);
    if (!block) return;

    block.animation = animation;
    editorCRDT.remoteUpdate(block, pageId);

    sendBlockUpdateOperation({
      node: block,
      pageId,
    });

    setEditorState((prev) => ({
      clock: editorCRDT.clock,
      linkedList: editorCRDT.LinkedList,
      currentBlock: blockId || prev.currentBlock,
    }));
  };

  return {
    handleTypeSelect,
    handleAnimationSelect,
  };
};
