import { BlockCRDT, EditorCRDT } from "@noctaCrdt/Crdt";
import {
  AnimationType,
  ElementType,
  RemoteBlockDeleteOperation,
  RemoteBlockInsertOperation,
  RemoteBlockUpdateOperation,
  RemoteCharInsertOperation,
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
    }>
  >;
  pageId: string;
  sendBlockUpdateOperation: (operation: RemoteBlockUpdateOperation) => void;
  sendBlockDeleteOperation: (operation: RemoteBlockDeleteOperation) => void;
  sendBlockInsertOperation: (operation: RemoteBlockInsertOperation) => void;
  sendCharInsertOperation: (operation: RemoteCharInsertOperation) => void;
}

export const useBlockOptionSelect = ({
  editorCRDT,
  editorState,
  setEditorState,
  pageId,
  sendBlockUpdateOperation,
  sendBlockDeleteOperation,
  sendBlockInsertOperation,
  sendCharInsertOperation,
}: useBlockOptionSelectProps) => {
  const handleTypeSelect = (blockId: BlockId, type: ElementType) => {
    const block = editorState.linkedList.getNode(blockId);
    if (!block) return;

    block.type = type;
    editorCRDT.currentBlock = block;
    editorCRDT.remoteUpdate(block, pageId);

    sendBlockUpdateOperation({
      node: block,
      pageId,
    });

    setEditorState({
      clock: editorCRDT.clock,
      linkedList: editorCRDT.LinkedList,
    });
  };

  const handleAnimationSelect = (blockId: BlockId, animation: AnimationType) => {
    const block = editorState.linkedList.getNode(blockId);
    if (!block) return;

    block.animation = animation;
    editorCRDT.currentBlock = block;
    editorCRDT.remoteUpdate(block, pageId);

    sendBlockUpdateOperation({
      node: block,
      pageId,
    });

    setEditorState({
      clock: editorCRDT.clock,
      linkedList: editorCRDT.LinkedList,
    });
  };

  const handleCopySelect = (blockId: BlockId) => {
    const currentBlock = editorState.linkedList.getNode(blockId);
    if (!currentBlock) return;

    const currentIndex = editorCRDT.LinkedList.spread().findIndex((block) =>
      block.id.equals(blockId),
    );

    const operation = editorCRDT.localInsert(currentIndex + 1, "");
    operation.node.type = currentBlock.type;
    operation.node.indent = currentBlock.indent;
    operation.node.animation = currentBlock.animation;
    operation.node.style = currentBlock.style;
    operation.node.icon = currentBlock.icon;
    operation.node.crdt = new BlockCRDT(editorCRDT.client);

    // 먼저 새로운 블록을 만들고
    sendBlockInsertOperation({ node: operation.node, pageId });

    // 내부 문자 노드 복사
    currentBlock.crdt.LinkedList.spread().forEach((char, index) => {
      const insertOperation = operation.node.crdt.localInsert(
        index,
        char.value,
        operation.node.id,
        pageId,
      );
      insertOperation.node.style = char.style;
      insertOperation.node.color = char.color;
      insertOperation.node.backgroundColor = char.backgroundColor;
      sendCharInsertOperation(insertOperation);
    });

    // 여기서 update를 한번 더 해주면 된다. (block의 속성 (animation, type, style, icon)을 복사하기 위함)
    sendBlockUpdateOperation({
      node: operation.node,
      pageId,
    });

    editorCRDT.currentBlock = operation.node;
    setEditorState({
      clock: editorCRDT.clock,
      linkedList: editorCRDT.LinkedList,
    });
  };

  const findBlock = (linkedList: BlockLinkedList, index: number) => {
    if (index < 0) return null;
    if (index >= linkedList.spread().length) return null;
    return linkedList.findByIndex(index);
  };

  const handleDeleteSelect = (blockId: BlockId) => {
    const currentIndex = editorCRDT.LinkedList.spread().findIndex((block) =>
      block.id.equals(blockId),
    );
    sendBlockDeleteOperation(editorCRDT.localDelete(currentIndex, undefined, pageId));

    // 삭제할 블록이 현재 활성화된 블록인 경우
    if (editorCRDT.currentBlock?.id.equals(blockId)) {
      // 다음 블록이나 이전 블록으로 currentBlock 설정
      // 서윤님 피드백 반영
      const nextBlock = findBlock(editorCRDT.LinkedList, currentIndex); // ✅ 이미 삭제한 후라, next는 currentIndex
      const prevBlock = findBlock(editorCRDT.LinkedList, currentIndex - 1); // ✅ 이미 삭제한 후라, prev는 currentIndex - 1
      editorCRDT.currentBlock = nextBlock || prevBlock || null;
    }

    setEditorState({
      clock: editorCRDT.clock,
      linkedList: editorCRDT.LinkedList,
    });
  };

  return {
    handleTypeSelect,
    handleAnimationSelect,
    handleCopySelect,
    handleDeleteSelect,
  };
};
