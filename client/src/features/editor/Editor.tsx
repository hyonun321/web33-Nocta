import { DndContext } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { EditorCRDT } from "@noctaCrdt/Crdt";
import { BlockLinkedList } from "@noctaCrdt/LinkedList";
import { Block as CRDTBlock } from "@noctaCrdt/Node";
import { BlockId } from "@noctaCrdt/NodeId";
import {
  RemoteCharInsertOperation,
  serializedEditorDataProps,
} from "node_modules/@noctaCrdt/Interfaces.ts";
import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import { useSocketStore } from "@src/stores/useSocketStore.ts";
import { editorContainer, editorTitleContainer, editorTitle } from "./Editor.style";
import { Block } from "./components/block/Block.tsx";
import { useBlockDragAndDrop } from "./hooks/useBlockDragAndDrop";
import { useBlockOptionSelect } from "./hooks/useBlockOption.ts";
import { useMarkdownGrammer } from "./hooks/useMarkdownGrammer";

interface EditorProps {
  onTitleChange: (title: string) => void;
  pageId: string;
  serializedEditorData: serializedEditorDataProps;
}

export interface EditorStateProps {
  clock: number;
  linkedList: BlockLinkedList;
  currentBlock: BlockId | null;
}
// TODO: pageId, editorCRDT를 props로 받아와야함
export const Editor = ({ onTitleChange, pageId, serializedEditorData }: EditorProps) => {
  const {
    sendCharInsertOperation,
    sendCharDeleteOperation,
    subscribeToRemoteOperations,
    sendBlockInsertOperation,
    sendBlockDeleteOperation,
    sendBlockUpdateOperation,
  } = useSocketStore();
  const editorCRDTInstance = useMemo(() => {
    const editor = new EditorCRDT(serializedEditorData.client);
    editor.deserialize(serializedEditorData);
    return editor;
  }, [serializedEditorData]);

  const editorCRDT = useRef<EditorCRDT>(editorCRDTInstance);
  const [editorState, setEditorState] = useState<EditorStateProps>({
    clock: editorCRDT.current.clock,
    linkedList: editorCRDT.current.LinkedList,
    currentBlock: null as BlockId | null,
  });
  const { sensors, handleDragEnd } = useBlockDragAndDrop({
    editorCRDT: editorCRDT.current,
    editorState,
    setEditorState,
    pageId,
  });

  const { handleTypeSelect, handleAnimationSelect } = useBlockOptionSelect({
    editorCRDT: editorCRDT.current,
    editorState,
    setEditorState,
    pageId,
    sendBlockUpdateOperation,
    sendBlockDeleteOperation,
    sendBlockInsertOperation,
  });

  const { handleKeyDown } = useMarkdownGrammer({
    editorCRDT: editorCRDT.current,
    editorState,
    setEditorState,
    pageId,
    sendBlockInsertOperation,
    sendBlockDeleteOperation,
    sendBlockUpdateOperation,
    sendCharDeleteOperation,
    sendCharInsertOperation,
  });

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onTitleChange(e.target.value);
  };

  const handleBlockClick = (blockId: BlockId, e: React.MouseEvent<HTMLDivElement>) => {
    try {
      const block = editorState.linkedList.getNode(blockId);
      if (!block) {
        console.warn("Block not found:", blockId);
        return;
      }

      const selection = window.getSelection();
      const range = document.caretRangeFromPoint(e.clientX, e.clientY);

      if (!selection || !range) {
        console.warn("Selection or range not available");
        return;
      }

      // 새로운 Range로 Selection 설정
      selection.removeAllRanges();
      selection.addRange(range);

      // 현재 캐럿 위치를 저장
      const caretPosition = selection.focusOffset;
      block.crdt.currentCaret = caretPosition;

      setEditorState((prev) => ({
        ...prev,
        currentBlock: blockId,
      }));
    } catch (error) {
      console.error("Error handling block click:", error);
    }
  };

  const handleBlockInput = useCallback(
    (e: React.FormEvent<HTMLDivElement>, block: CRDTBlock) => {
      if (!block) return;
      let operationNode;
      const element = e.currentTarget;
      const newContent = element.textContent || "";
      const currentContent = block.crdt.read();
      const selection = window.getSelection();
      const caretPosition = selection?.focusOffset || 0;

      if (newContent.length > currentContent.length) {
        let charNode: RemoteCharInsertOperation;
        if (caretPosition === 0) {
          const [addedChar] = newContent;
          charNode = block.crdt.localInsert(0, addedChar, block.id, pageId);
          block.crdt.currentCaret = 1;
        } else if (caretPosition > currentContent.length) {
          const addedChar = newContent[newContent.length - 1];
          charNode = block.crdt.localInsert(currentContent.length, addedChar, block.id, pageId);
          block.crdt.currentCaret = caretPosition;
        } else {
          const addedChar = newContent[caretPosition - 1];
          charNode = block.crdt.localInsert(caretPosition - 1, addedChar, block.id, pageId);
          block.crdt.currentCaret = caretPosition;
        }
        sendCharInsertOperation({ node: charNode.node, blockId: block.id, pageId });
      } else if (newContent.length < currentContent.length) {
        // 문자가 삭제된 경우
        operationNode = block.crdt.localDelete(caretPosition, block.id, pageId);
        block.crdt.currentCaret = caretPosition;
        sendCharDeleteOperation(operationNode);
      }

      setEditorState((prev) => ({
        clock: editorCRDT.current.clock,
        linkedList: editorCRDT.current.LinkedList,
        currentBlock: prev.currentBlock,
      }));
    },
    [sendCharInsertOperation, sendCharDeleteOperation],
  );

  const subscriptionRef = useRef(false);

  useEffect(() => {
    if (subscriptionRef.current) return;
    subscriptionRef.current = true;

    const unsubscribe = subscribeToRemoteOperations({
      onRemoteBlockInsert: (operation) => {
        console.log(operation, "block : 입력 확인합니다이");
        if (!editorCRDT.current) return;
        editorCRDT.current.remoteInsert(operation);
        setEditorState((prev) => ({
          clock: editorCRDT.current.clock,
          linkedList: editorCRDT.current.LinkedList,
          currentBlock: prev.currentBlock,
        }));
      },

      onRemoteBlockDelete: (operation) => {
        console.log(operation, "block : 삭제 확인합니다이");
        if (!editorCRDT.current) return;
        editorCRDT.current.remoteDelete(operation);
        setEditorState((prev) => ({
          clock: editorCRDT.current.clock,
          linkedList: editorCRDT.current.LinkedList,
          currentBlock: prev.currentBlock,
        }));
      },

      onRemoteCharInsert: (operation) => {
        console.log(operation, "char : 입력 확인합니다이");
        if (!editorCRDT.current) return;
        const targetBlock =
          editorCRDT.current.LinkedList.nodeMap[JSON.stringify(operation.blockId)];
        targetBlock.crdt.remoteInsert(operation);
        setEditorState((prev) => ({
          clock: editorCRDT.current.clock,
          linkedList: editorCRDT.current.LinkedList,
          currentBlock: prev.currentBlock,
        }));
      },

      onRemoteCharDelete: (operation) => {
        console.log(operation, "char : 삭제 확인합니다이");
        if (!editorCRDT.current) return;
        const targetBlock =
          editorCRDT.current.LinkedList.nodeMap[JSON.stringify(operation.blockId)];
        targetBlock.crdt.remoteDelete(operation);
        setEditorState((prev) => ({
          clock: editorCRDT.current.clock,
          linkedList: editorCRDT.current.LinkedList,
          currentBlock: prev.currentBlock,
        }));
      },

      onRemoteBlockUpdate: (operation) => {
        console.log(operation, "block : 업데이트 확인합니다이");
        if (!editorCRDT.current) return;
        // ??
        console.log("타입", operation.node);
        editorCRDT.current.remoteUpdate(operation.node, operation.pageId);
        setEditorState((prev) => ({
          clock: editorCRDT.current.clock,
          linkedList: editorCRDT.current.LinkedList,
          currentBlock: prev.currentBlock,
        }));
      },

      onRemoteBlockReorder: (operation) => {
        console.log(operation, "block : 재정렬 확인합니다이");
        if (!editorCRDT.current) return;
        editorCRDT.current.remoteReorder(operation);
        setEditorState((prev) => ({
          clock: editorCRDT.current.clock,
          linkedList: editorCRDT.current.LinkedList,
          currentBlock: prev.currentBlock,
        }));
      },

      onRemoteCursor: (position) => {
        console.log(position, "커서위치 수신");
      },
    });

    return () => {
      subscriptionRef.current = false;
      unsubscribe?.();
    };
  }, []);

  const tempBlock = () => {
    const index = editorCRDT.current.LinkedList.spread().length;

    // 로컬 삽입을 수행하고 연산 객체를 반환받음
    const operation = editorCRDT.current.localInsert(index, "");
    sendBlockInsertOperation({ node: operation.node, pageId });
    console.log("operation clock", operation.node);
    setEditorState(() => ({
      clock: operation.node.id.clock,
      linkedList: editorCRDT.current.LinkedList,
      currentBlock: operation.node.id,
    }));
  };

  return (
    <div className={editorContainer}>
      <div className={editorTitleContainer}>
        <input
          type="text"
          placeholder="제목을 입력하세요..."
          onChange={handleTitleChange}
          className={editorTitle}
        />
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <SortableContext
            items={editorState.linkedList
              .spread()
              .map((block) => `${block.id.client}-${block.id.clock}`)}
            strategy={verticalListSortingStrategy}
          >
            {editorState.linkedList.spread().map((block) => (
              <Block
                key={`${block.id.client}-${block.id.clock}`}
                id={`${block.id.client}-${block.id.clock}`}
                block={block}
                isActive={block.id === editorState.currentBlock}
                onInput={handleBlockInput}
                onKeyDown={handleKeyDown}
                onClick={handleBlockClick}
                onAnimationSelect={handleAnimationSelect}
                onTypeSelect={handleTypeSelect}
              />
            ))}
          </SortableContext>
        </DndContext>
        <div onClick={tempBlock}>임시</div>
      </div>
    </div>
  );
};
