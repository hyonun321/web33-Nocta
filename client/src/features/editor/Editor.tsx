import { DndContext } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { EditorCRDT } from "@noctaCrdt/Crdt";
import { BlockLinkedList } from "@noctaCrdt/LinkedList";
import { Block as CRDTBlock } from "@noctaCrdt/Node";
import { serializedEditorDataProps } from "node_modules/@noctaCrdt/Interfaces.ts";
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
    sendBlockInsertOperation({ node: operation.node, pageId });
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

  useEffect(() => {
    if (!editorCRDT) return;
    if (subscriptionRef.current) return;
    subscriptionRef.current = true;

    const unsubscribe = subscribeToRemoteOperations({
      onRemoteBlockInsert: (operation) => {
        console.log(operation, "block : 입력 확인합니다이");
        if (operation.pageId !== pageId) return;
        editorCRDT.current.remoteInsert(operation);
        setEditorState({
          clock: editorCRDT.current.clock,
          linkedList: editorCRDT.current.LinkedList,
        });
      },

      onRemoteBlockDelete: (operation) => {
        console.log(operation, "block : 삭제 확인합니다이");
        if (operation.pageId !== pageId) return;
        editorCRDT.current.remoteDelete(operation);
        setEditorState({
          clock: editorCRDT.current.clock,
          linkedList: editorCRDT.current.LinkedList,
        });
      },

      onRemoteCharInsert: (operation) => {
        console.log(operation, "char : 입력 확인합니다이");
        if (operation.pageId !== pageId) return;
        const targetBlock =
          editorCRDT.current.LinkedList.nodeMap[JSON.stringify(operation.blockId)];
        if (targetBlock) {
          targetBlock.crdt.remoteInsert(operation);
          setEditorState({
            clock: editorCRDT.current.clock,
            linkedList: editorCRDT.current.LinkedList,
          });
        }
      },

      onRemoteCharDelete: (operation) => {
        console.log(operation, "char : 삭제 확인합니다이");
        if (operation.pageId !== pageId) return;
        const targetBlock =
          editorCRDT.current.LinkedList.nodeMap[JSON.stringify(operation.blockId)];
        if (targetBlock) {
          targetBlock.crdt.remoteDelete(operation);
          setEditorState({
            clock: editorCRDT.current.clock,
            linkedList: editorCRDT.current.LinkedList,
          });
        }
      },

      onRemoteBlockUpdate: (operation) => {
        console.log(operation, "block : 업데이트 확인합니다이");
        if (operation.pageId !== pageId) return;
        editorCRDT.current.remoteUpdate(operation.node, operation.pageId);
        setEditorState({
          clock: editorCRDT.current.clock,
          linkedList: editorCRDT.current.LinkedList,
        });
      },

      onRemoteBlockReorder: (operation) => {
        console.log(operation, "block : 재정렬 확인합니다이");
        if (operation.pageId !== pageId) return;
        editorCRDT.current.remoteReorder(operation);
        setEditorState({
          clock: editorCRDT.current.clock,
          linkedList: editorCRDT.current.LinkedList,
        });
      },

      onRemoteCharUpdate: (operation) => {
        console.log(operation, "char : 업데이트 확인합니다이");
        if (!editorCRDT) return;
        if (operation.pageId !== pageId) return;
        const targetBlock =
          editorCRDT.current.LinkedList.nodeMap[JSON.stringify(operation.blockId)];
        targetBlock.crdt.remoteUpdate(operation);
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
  }, [editorCRDT, subscribeToRemoteOperations, pageId]);

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
