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
import { useRef, useState, useCallback, useEffect, useLayoutEffect } from "react";
import { useSocketStore } from "@src/stores/useSocketStore.ts";
import { setCaretPosition } from "@src/utils/caretUtils.ts";
import {
  editorContainer,
  editorTitleContainer,
  editorTitle,
  addNewBlockButton,
} from "./Editor.style";
import { Block } from "./components/block/Block.tsx";
import { useBlockDragAndDrop } from "./hooks/useBlockDragAndDrop";
import { useBlockOptionSelect } from "./hooks/useBlockOption.ts";
import { useMarkdownGrammer } from "./hooks/useMarkdownGrammer";

interface EditorProps {
  onTitleChange: (title: string) => void;
  pageId: string;
  serializedEditorData: serializedEditorDataProps | null;
}

export interface EditorStateProps {
  clock: number;
  linkedList: BlockLinkedList;
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
  const { clientId } = useSocketStore();

  const editorCRDT = useRef<EditorCRDT>(
    (() => {
      if (!serializedEditorData) {
        return new EditorCRDT(clientId ? clientId : 0);
      }
      const editor = new EditorCRDT(serializedEditorData.client);
      editor.deserialize(serializedEditorData);
      return editor;
    })(),
  );

  // Editor의 상태도 editorCRDT 기반으로 초기화
  const [editorState, setEditorState] = useState<EditorStateProps>({
    clock: editorCRDT.current.clock,
    linkedList: editorCRDT.current.LinkedList,
  });

  // editorCRDT가 변경될 때마다 editorState 업데이트
  useEffect(() => {
    setEditorState({
      clock: editorCRDT.current.clock,
      linkedList: editorCRDT.current.LinkedList,
      currentBlock: null,
    });
  }, [editorCRDT]);

  const { sensors, handleDragEnd } = useBlockDragAndDrop({
    editorCRDT: editorCRDT.current,
    editorState,
    setEditorState,
    pageId,
  });

  const { handleTypeSelect, handleAnimationSelect, handleCopySelect, handleDeleteSelect } =
    useBlockOptionSelect({
      editorCRDT: editorCRDT.current,
      editorState,
      setEditorState,
      pageId,
      sendBlockUpdateOperation,
      sendBlockDeleteOperation,
      sendBlockInsertOperation,
      sendCharInsertOperation,
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

  const handleBlockClick = (blockId: BlockId) => {
    editorCRDT.current.currentBlock =
      editorCRDT.current.LinkedList.nodeMap[JSON.stringify(blockId)];
  };

  const handleBlockInput = useCallback(
    (e: React.FormEvent<HTMLDivElement>, block: CRDTBlock) => {
      if (!block) return;
      if ((e.nativeEvent as InputEvent).isComposing) {
        return;
      }

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
          editorCRDT.current.currentBlock!.crdt.currentCaret = caretPosition;
          requestAnimationFrame(() => {
            setCaretPosition({
              blockId: block.id,
              linkedList: editorCRDT.current.LinkedList,
              position: caretPosition,
            });
          });
        } else if (caretPosition > currentContent.length) {
          const addedChar = newContent[newContent.length - 1];
          charNode = block.crdt.localInsert(currentContent.length, addedChar, block.id, pageId);
          editorCRDT.current.currentBlock!.crdt.currentCaret = caretPosition;
          requestAnimationFrame(() => {
            setCaretPosition({
              blockId: block.id,
              linkedList: editorCRDT.current.LinkedList,
              position: caretPosition,
            });
          });
        } else {
          const addedChar = newContent[caretPosition - 1];
          charNode = block.crdt.localInsert(caretPosition - 1, addedChar, block.id, pageId);
          editorCRDT.current.currentBlock!.crdt.currentCaret = caretPosition;
          requestAnimationFrame(() => {
            setCaretPosition({
              blockId: block.id,
              linkedList: editorCRDT.current.LinkedList,
              position: caretPosition,
            });
          });
        }
        sendCharInsertOperation({ node: charNode.node, blockId: block.id, pageId });
      } else if (newContent.length < currentContent.length) {
        // 문자가 삭제된 경우
        operationNode = block.crdt.localDelete(caretPosition, block.id, pageId);
        sendCharDeleteOperation(operationNode);
        editorCRDT.current.currentBlock!.crdt.currentCaret = caretPosition;
        requestAnimationFrame(() => {
          setCaretPosition({
            blockId: block.id,
            linkedList: editorCRDT.current.LinkedList,
            position: caretPosition,
          });
        });
      }
      setEditorState({
        clock: editorCRDT.current.clock,
        linkedList: editorCRDT.current.LinkedList,
      });
    },
    [sendCharInsertOperation, sendCharDeleteOperation],
  );

  const handleCompositionEnd = (e: React.CompositionEvent<HTMLDivElement>, block: CRDTBlock) => {
    const event = e.nativeEvent as CompositionEvent;
    const characters = [...event.data];
    const selection = window.getSelection();
    const caretPosition = selection?.focusOffset || 0;
    const startPosition = caretPosition - characters.length;

    characters.forEach((char, index) => {
      const insertPosition = startPosition + index;
      const charNode = block.crdt.localInsert(insertPosition, char, block.id, pageId);

      sendCharInsertOperation({
        node: charNode.node,
        blockId: block.id,
        pageId,
      });
    });

    block.crdt.currentCaret = caretPosition;
  };

  const subscriptionRef = useRef(false);

  useLayoutEffect(() => {
    if (!editorCRDT.current.currentBlock) return;
    setCaretPosition({
      blockId: editorCRDT.current.currentBlock.id,
      linkedList: editorCRDT.current.LinkedList,
      position: editorCRDT.current.currentBlock?.crdt.currentCaret,
    });
  }, [editorCRDT.current.currentBlock?.crdt.read().length]);

  useEffect(() => {
    if (subscriptionRef.current) return;
    subscriptionRef.current = true;

    const unsubscribe = subscribeToRemoteOperations({
      onRemoteBlockInsert: (operation) => {
        console.log(operation, "block : 입력 확인합니다이");
        if (!editorCRDT || operation.pageId !== pageId) return;
        editorCRDT.current.remoteInsert(operation);
        setEditorState({
          clock: editorCRDT.current.clock,
          linkedList: editorCRDT.current.LinkedList,
        });
      },

      onRemoteBlockDelete: (operation) => {
        console.log(operation, "block : 삭제 확인합니다이");
        if (!editorCRDT || operation.pageId !== pageId) return;
        editorCRDT.current.remoteDelete(operation);
        setEditorState({
          clock: editorCRDT.current.clock,
          linkedList: editorCRDT.current.LinkedList,
        });
      },

      onRemoteCharInsert: (operation) => {
        console.log(operation, "char : 입력 확인합니다이");
        if (!editorCRDT || operation.pageId !== pageId) return;
        const targetBlock =
          editorCRDT.current.LinkedList.nodeMap[JSON.stringify(operation.blockId)];
        targetBlock.crdt.remoteInsert(operation);
        setEditorState({
          clock: editorCRDT.current.clock,
          linkedList: editorCRDT.current.LinkedList,
        });
      },

      onRemoteCharDelete: (operation) => {
        console.log(operation, "char : 삭제 확인합니다이");
        if (!editorCRDT || operation.pageId !== pageId) return;
        const targetBlock =
          editorCRDT.current.LinkedList.nodeMap[JSON.stringify(operation.blockId)];
        targetBlock.crdt.remoteDelete(operation);
        setEditorState({
          clock: editorCRDT.current.clock,
          linkedList: editorCRDT.current.LinkedList,
        });
      },

      onRemoteBlockUpdate: (operation) => {
        console.log(operation, "block : 업데이트 확인합니다이");
        if (!editorCRDT || operation.pageId !== pageId) return;
        editorCRDT.current.remoteUpdate(operation.node, operation.pageId);
        setEditorState({
          clock: editorCRDT.current.clock,
          linkedList: editorCRDT.current.LinkedList,
        });
      },

      onRemoteBlockReorder: (operation) => {
        console.log(operation, "block : 재정렬 확인합니다이");
        if (!editorCRDT || operation.pageId !== pageId) return;
        editorCRDT.current.remoteReorder(operation);
        setEditorState({
          clock: editorCRDT.current.clock,
          linkedList: editorCRDT.current.LinkedList,
        });
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

  const addNewBlock = () => {
    const index = editorCRDT.current.LinkedList.spread().length;
    const operation = editorCRDT.current.localInsert(index, "");
    sendBlockInsertOperation({ node: operation.node, pageId });
    setEditorState(() => ({
      clock: operation.node.id.clock,
      linkedList: editorCRDT.current.LinkedList,
    });
  };

  // 로딩 상태 체크
  if (!serializedEditorData) {
    return <div>Loading editor data...</div>;
  }
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
                isActive={block.id === editorCRDT.current.currentBlock?.id}
                onInput={handleBlockInput}
                onCompositionEnd={handleCompositionEnd}
                onKeyDown={handleKeyDown}
                onClick={handleBlockClick}
                onAnimationSelect={handleAnimationSelect}
                onTypeSelect={handleTypeSelect}
                onCopySelect={handleCopySelect}
                onDeleteSelect={handleDeleteSelect}
              />
            ))}
          </SortableContext>
        </DndContext>
        {editorState.linkedList.spread().length === 0 && (
          <div className={addNewBlockButton} onClick={addNewBlock}>
            클릭해서 새로운 블록을 추가하세요
          </div>
        )}
      </div>
    </div>
  );
};
