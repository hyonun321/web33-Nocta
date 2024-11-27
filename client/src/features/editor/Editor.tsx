import { DndContext } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { EditorCRDT } from "@noctaCrdt/Crdt";
import { BlockLinkedList } from "@noctaCrdt/LinkedList";
import { Block as CRDTBlock } from "@noctaCrdt/Node";
import {
  RemoteBlockDeleteOperation,
  RemoteBlockInsertOperation,
  RemoteBlockReorderOperation,
  RemoteBlockUpdateOperation,
  RemoteCharDeleteOperation,
  RemoteCharInsertOperation,
  RemoteCharUpdateOperation,
  serializedEditorDataProps,
} from "node_modules/@noctaCrdt/Interfaces.ts";
import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import { useSocketStore } from "@src/stores/useSocketStore.ts";
import { setCaretPosition } from "@src/utils/caretUtils.ts";
import {
  editorContainer,
  editorTitleContainer,
  editorTitle,
  addNewBlockButton,
} from "./Editor.style";
import { Block } from "./components/block/Block";
import { useBlockDragAndDrop } from "./hooks/useBlockDragAndDrop";
import { useBlockOperation } from "./hooks/useBlockOperation.ts";
import { useBlockOptionSelect } from "./hooks/useBlockOption";
import { useCopyAndPaste } from "./hooks/useCopyAndPaste.ts";
import { useMarkdownGrammer } from "./hooks/useMarkdownGrammer";
import { useTextOptionSelect } from "./hooks/useTextOptions.ts";

export interface EditorStateProps {
  clock: number;
  linkedList: BlockLinkedList;
}

interface EditorProps {
  onTitleChange: (title: string, syncWithServer: boolean) => void;
  pageId: string;
  serializedEditorData: serializedEditorDataProps;
  pageTitle: string;
}

export const Editor = ({ onTitleChange, pageId, pageTitle, serializedEditorData }: EditorProps) => {
  const {
    sendCharInsertOperation,
    sendCharDeleteOperation,
    subscribeToRemoteOperations,
    sendBlockInsertOperation,
    sendBlockDeleteOperation,
    sendBlockUpdateOperation,
  } = useSocketStore();
  const { clientId } = useSocketStore();

  const [displayTitle, setDisplayTitle] = useState(
    pageTitle === "새로운 페이지" || pageTitle === "" ? "" : pageTitle,
  );

  const editorCRDTInstance = useMemo(() => {
    let newEditorCRDT;
    if (serializedEditorData) {
      newEditorCRDT = new EditorCRDT(serializedEditorData.client);
      newEditorCRDT.deserialize(serializedEditorData);
    } else {
      newEditorCRDT = new EditorCRDT(clientId ? clientId : 0);
    }
    return newEditorCRDT;
  }, [serializedEditorData, clientId]);

  const editorCRDT = useRef<EditorCRDT>(editorCRDTInstance);

  // editorState도 editorCRDT가 변경될 때마다 업데이트
  const [editorState, setEditorState] = useState<EditorStateProps>({
    clock: editorCRDT.current.clock,
    linkedList: editorCRDT.current.LinkedList,
  });

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

  const { handleKeyDown: onKeyDown, handleInput: handleHrInput } = useMarkdownGrammer({
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

  const { handleBlockClick, handleBlockInput, handleKeyDown } = useBlockOperation({
    editorCRDT: editorCRDT.current,
    setEditorState,
    pageId,
    onKeyDown,
    handleHrInput,
  });

  const { onTextStyleUpdate, onTextColorUpdate, onTextBackgroundColorUpdate } = useTextOptionSelect(
    {
      editorCRDT: editorCRDT.current,
      setEditorState,
      pageId,
    },
  );

  const { handleCopy, handlePaste } = useCopyAndPaste({
    editorCRDT: editorCRDT.current,
    setEditorState,
    pageId,
  });

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setDisplayTitle(newTitle); // 로컬 상태 업데이트
    onTitleChange(newTitle, false); // 낙관적 업데이트
  };

  const handleBlur = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    if (newTitle === "") {
      setDisplayTitle(""); // 입력이 비어있으면 로컬상태는 빈 문자열로
      onTitleChange("새로운 페이지", true); // 서버에는 "새로운 페이지"로 저장
    } else {
      onTitleChange(newTitle, true);
    }
  };

  const handleCompositionEnd = useCallback(
    (e: React.CompositionEvent<HTMLDivElement>, block: CRDTBlock) => {
      if (!editorCRDT) return;
      const event = e.nativeEvent as CompositionEvent;
      const characters = [...event.data];
      const selection = window.getSelection();
      const caretPosition = selection?.focusOffset || 0;
      const startPosition = caretPosition - characters.length;

      characters.forEach((char, index) => {
        const insertPosition = startPosition + index;
        const charNode = block.crdt.localInsert(insertPosition, char, block.id, pageId);

        sendCharInsertOperation({
          type: "charInsert",
          node: charNode.node,
          blockId: block.id,
          pageId,
        });
      });

      block.crdt.currentCaret = caretPosition;
    },
    [editorCRDT, pageId, sendCharInsertOperation],
  );

  const addNewBlock = () => {
    if (!editorCRDT) return;
    const index = editorCRDT.current.LinkedList.spread().length;
    const operation = editorCRDT.current.localInsert(index, "");
    editorCRDT.current.currentBlock = operation.node;
    sendBlockInsertOperation({ type: "blockInsert", node: operation.node, pageId });
    setEditorState(() => ({
      clock: editorCRDT.current.clock,
      linkedList: editorCRDT.current.LinkedList,
    }));
  };

  const subscriptionRef = useRef(false);

  useEffect(() => {
    if (!editorCRDT || !editorCRDT.current.currentBlock) return;

    const { activeElement } = document;
    if (activeElement?.tagName.toLowerCase() === "input") {
      return; // input에 포커스가 있으면 캐럿 위치 변경하지 않음
    }
    setCaretPosition({
      blockId: editorCRDT.current.currentBlock.id,
      linkedList: editorCRDT.current.LinkedList,
      position: editorCRDT.current.currentBlock?.crdt.currentCaret,
      pageId,
    });
    // 서윤님 피드백 반영
  }, [editorCRDT.current.currentBlock?.id.serialize()]);

  const handleRemoteBlockInsert = useCallback(
    (operation: RemoteBlockInsertOperation) => {
      console.log(operation, "block : 입력 확인합니다이");
      if (operation.pageId !== pageId) return;
      const prevBlock = editorCRDT.current.LinkedList.nodeMap[JSON.stringify(operation.node.prev)];
      editorCRDT.current.remoteInsert(operation);
      if (prevBlock.type === "ol") {
        editorCRDT.current.LinkedList.updateAllOrderedListIndices();
        console.log("ol update");
      }
      setEditorState({
        clock: editorCRDT.current.clock,
        linkedList: editorCRDT.current.LinkedList,
      });
    },
    [pageId, editorCRDT],
  );

  const handleRemoteBlockDelete = useCallback(
    (operation: RemoteBlockDeleteOperation) => {
      console.log(operation, "block : 삭제 확인합니다이");
      if (operation.pageId !== pageId) return;
      const targetBlock = editorCRDT.current.LinkedList.nodeMap[JSON.stringify(operation.targetId)];
      const prevBlock = editorCRDT.current.LinkedList.nodeMap[JSON.stringify(targetBlock.prev)];
      const nextBlock = editorCRDT.current.LinkedList.nodeMap[JSON.stringify(targetBlock.next)];
      editorCRDT.current.remoteDelete(operation);
      if (prevBlock.type === "ol" && nextBlock.type === "ol") {
        editorCRDT.current.LinkedList.updateAllOrderedListIndices();
      }
      setEditorState({
        clock: editorCRDT.current.clock,
        linkedList: editorCRDT.current.LinkedList,
      });
    },
    [pageId, editorCRDT],
  );

  const handleRemoteCharInsert = useCallback(
    (operation: RemoteCharInsertOperation) => {
      console.log(operation, "char : 입력 확인합니다이");
      if (operation.pageId !== pageId) return;
      const targetBlock = editorCRDT.current.LinkedList.nodeMap[JSON.stringify(operation.blockId)];
      if (targetBlock) {
        targetBlock.crdt.remoteInsert(operation);
        setEditorState({
          clock: editorCRDT.current.clock,
          linkedList: editorCRDT.current.LinkedList,
        });
      }
    },
    [pageId, editorCRDT],
  );

  const handleRemoteCharDelete = useCallback(
    (operation: RemoteCharDeleteOperation) => {
      console.log(operation, "char : 삭제 확인합니다이");
      if (operation.pageId !== pageId) return;
      const targetBlock = editorCRDT.current.LinkedList.nodeMap[JSON.stringify(operation.blockId)];
      if (targetBlock) {
        targetBlock.crdt.remoteDelete(operation);
        setEditorState({
          clock: editorCRDT.current.clock,
          linkedList: editorCRDT.current.LinkedList,
        });
      }
    },
    [pageId, editorCRDT],
  );

  const handleRemoteBlockUpdate = useCallback(
    (operation: RemoteBlockUpdateOperation) => {
      console.log(operation, "block : 업데이트 확인합니다이");
      if (operation.pageId !== pageId) return;
      const prevBlock = editorCRDT.current.LinkedList.nodeMap[JSON.stringify(operation.node.prev)];
      editorCRDT.current.remoteUpdate(operation.node, operation.pageId);
      if (prevBlock.type === "ol") {
        editorCRDT.current.LinkedList.updateAllOrderedListIndices();
      }
      setEditorState({
        clock: editorCRDT.current.clock,
        linkedList: editorCRDT.current.LinkedList,
      });
    },
    [pageId, editorCRDT],
  );

  const handleRemoteBlockReorder = useCallback(
    (operation: RemoteBlockReorderOperation) => {
      console.log(operation, "block : 재정렬 확인합니다이");
      if (operation.pageId !== pageId) return;
      editorCRDT.current.remoteReorder(operation);
      editorCRDT.current.LinkedList.updateAllOrderedListIndices();
      setEditorState({
        clock: editorCRDT.current.clock,
        linkedList: editorCRDT.current.LinkedList,
      });
    },
    [pageId, editorCRDT],
  );

  const handleRemoteCharUpdate = useCallback(
    (operation: RemoteCharUpdateOperation) => {
      console.log(operation, "char : 업데이트 확인합니다이");
      if (!editorCRDT) return;
      if (operation.pageId !== pageId) return;
      const targetBlock = editorCRDT.current.LinkedList.nodeMap[JSON.stringify(operation.blockId)];
      targetBlock.crdt.remoteUpdate(operation);
      setEditorState({
        clock: editorCRDT.current.clock,
        linkedList: editorCRDT.current.LinkedList,
      });
    },
    [pageId, editorCRDT],
  );

  const handleRemoteCursor = useCallback((position: any) => {
    console.log(position, "커서위치 수신");
  }, []);

  useEffect(() => {
    if (!editorCRDT) return;
    if (subscriptionRef.current) return;
    subscriptionRef.current = true;

    const unsubscribe = subscribeToRemoteOperations({
      onRemoteBlockInsert: handleRemoteBlockInsert,
      onRemoteBlockDelete: handleRemoteBlockDelete,
      onRemoteCharInsert: handleRemoteCharInsert,
      onRemoteCharDelete: handleRemoteCharDelete,
      onRemoteBlockUpdate: handleRemoteBlockUpdate,
      onRemoteBlockReorder: handleRemoteBlockReorder,
      onRemoteCharUpdate: handleRemoteCharUpdate,
      onRemoteCursor: handleRemoteCursor,
      onBatchOperations: (batch) => {
        console.log(batch, "batch: 배치 수신");
        for (const item of batch) {
          switch (item.event) {
            case "insert/block":
              handleRemoteBlockInsert(item.operation);
              break;
            case "delete/block":
              handleRemoteBlockDelete(item.operation);
              break;
            case "insert/char":
              handleRemoteCharInsert(item.operation);
              break;
            case "delete/char":
              handleRemoteCharDelete(item.operation);
              break;
            case "update/block":
              handleRemoteBlockUpdate(item.operation);
              break;
            case "reorder/block":
              handleRemoteBlockReorder(item.operation);
              break;
            case "update/char":
              handleRemoteCharUpdate(item.operation);
              break;
            default:
              console.warn("알 수 없는 연산 타입:", item.event);
          }
        }
      },
    });

    return () => {
      subscriptionRef.current = false;
      unsubscribe?.();
    };
  }, [
    editorCRDT,
    subscribeToRemoteOperations,
    pageId,
    handleRemoteBlockInsert,
    handleRemoteBlockDelete,
    handleRemoteCharInsert,
    handleRemoteCharDelete,
    handleRemoteBlockUpdate,
    handleRemoteBlockReorder,
    handleRemoteCharUpdate,
    handleRemoteCursor,
  ]);

  // 로딩 상태 체크
  if (!editorCRDT || !editorState) {
    return <div>Loading editor data...</div>;
  }
  return (
    <div className={editorContainer}>
      <div className={editorTitleContainer}>
        <input
          type="text"
          placeholder="제목을 입력하세요..."
          onChange={handleTitleChange}
          onBlur={handleBlur}
          value={displayTitle}
          className={editorTitle}
        />
        <div style={{ height: "36px" }}></div>
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
                onCopy={handleCopy}
                onPaste={handlePaste}
                onClick={handleBlockClick}
                onAnimationSelect={handleAnimationSelect}
                onTypeSelect={handleTypeSelect}
                onCopySelect={handleCopySelect}
                onDeleteSelect={handleDeleteSelect}
                onTextStyleUpdate={onTextStyleUpdate}
                onTextColorUpdate={onTextColorUpdate}
                onTextBackgroundColorUpdate={onTextBackgroundColorUpdate}
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
