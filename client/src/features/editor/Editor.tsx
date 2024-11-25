import { DndContext } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { EditorCRDT } from "@noctaCrdt/Crdt";
import { BlockLinkedList } from "@noctaCrdt/LinkedList";
import { Block as CRDTBlock } from "@noctaCrdt/Node";
import { BlockId } from "@noctaCrdt/NodeId";
import {
  RemoteCharInsertOperation,
  serializedEditorDataProps,
  TextColorType,
  BackgroundColorType,
} from "node_modules/@noctaCrdt/Interfaces.ts";
import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import { useSocketStore } from "@src/stores/useSocketStore.ts";
import { setCaretPosition, getAbsoluteCaretPosition } from "@src/utils/caretUtils.ts";
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
import { useTextOptionSelect } from "./hooks/useTextOptions.ts";
import { getTextOffset } from "./utils/domSyncUtils.ts";

export interface EditorStateProps {
  clock: number;
  linkedList: BlockLinkedList;
}

interface EditorProps {
  onTitleChange: (title: string) => void;
  pageId: string;
  serializedEditorData: serializedEditorDataProps;
}

interface ClipboardMetadata {
  value: string;
  style: string[];
  color: TextColorType | undefined;
  backgroundColor: BackgroundColorType | undefined;
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

  const { onTextStyleUpdate, onTextColorUpdate, onTextBackgroundColorUpdate } = useTextOptionSelect(
    {
      editorCRDT: editorCRDT.current,
      setEditorState,
      pageId,
    },
  );

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onTitleChange(e.target.value);
  };

  const handleBlockClick = (blockId: BlockId, e: React.MouseEvent<HTMLDivElement>) => {
    const selection = window.getSelection();
    if (!selection) return;

    const clickedElement = (e.target as HTMLElement).closest(
      '[contenteditable="true"]',
    ) as HTMLDivElement;
    if (!clickedElement) return;

    editorCRDT.current.currentBlock =
      editorCRDT.current.LinkedList.nodeMap[JSON.stringify(blockId)];
    const caretPosition = getAbsoluteCaretPosition(clickedElement);

    // 계산된 캐럿 위치 저장
    editorCRDT.current.currentBlock.crdt.currentCaret = caretPosition;
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
      const caretPosition = getAbsoluteCaretPosition(element);
      console.log({
        newContent,
        currentContent,
        caretPosition,
      });

      if (newContent.length > currentContent.length) {
        let charNode: RemoteCharInsertOperation;
        // 캐럿 위치 유효성 검사
        const validCaretPosition = Math.min(Math.max(0, caretPosition), currentContent.length);
        // 맨 앞에 삽입
        if (caretPosition === 0) {
          const [addedChar] = newContent;
          charNode = block.crdt.localInsert(0, addedChar, block.id, pageId);
        } else if (caretPosition > currentContent.length) {
          // 맨 뒤에 삽입
          const addedChar = newContent[newContent.length - 1];
          charNode = block.crdt.localInsert(currentContent.length, addedChar, block.id, pageId);
        } else {
          // 중간에 삽입
          const addedChar = newContent[validCaretPosition - 1];
          charNode = block.crdt.localInsert(validCaretPosition - 1, addedChar, block.id, pageId);
        }
        editorCRDT.current.currentBlock!.crdt.currentCaret = caretPosition;
        sendCharInsertOperation({ node: charNode.node, blockId: block.id, pageId });
      } else if (newContent.length < currentContent.length) {
        // 문자가 삭제된 경우
        // 삭제 위치 계산
        const deletePosition = Math.max(0, caretPosition);
        if (deletePosition >= 0 && deletePosition < currentContent.length) {
          operationNode = block.crdt.localDelete(deletePosition, block.id, pageId);
          sendCharDeleteOperation(operationNode);

          // 캐럿 위치 업데이트
          editorCRDT.current.currentBlock!.crdt.currentCaret = deletePosition;
        }
      }
      setEditorState({
        clock: editorCRDT.current.clock,
        linkedList: editorCRDT.current.LinkedList,
      });
    },
    [sendCharInsertOperation, sendCharDeleteOperation],
  );

  const handleCopy = (
    e: React.ClipboardEvent<HTMLDivElement>,
    blockRef: HTMLDivElement | null,
    block: CRDTBlock,
  ) => {
    e.preventDefault();
    if (!blockRef) return;

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !blockRef) return;

    const range = selection.getRangeAt(0);
    if (!blockRef.contains(range.commonAncestorContainer)) return;

    // 선택된 텍스트의 시작과 끝 위치 계산
    const startOffset = getTextOffset(blockRef, range.startContainer, range.startOffset);
    const endOffset = getTextOffset(blockRef, range.endContainer, range.endOffset);

    // 선택된 텍스트와 스타일 정보 추출
    const selectedChars = block.crdt.LinkedList.spread().slice(startOffset, endOffset);

    // 커스텀 데이터 포맷으로 저장
    const customData = {
      text: selectedChars.map((char) => char.value).join(""),
      metadata: selectedChars.map(
        (char) =>
          ({
            value: char.value,
            style: char.style,
            color: char.color,
            backgroundColor: char.backgroundColor,
          }) as ClipboardMetadata,
      ),
    };

    // 일반 텍스트와 커스텀 데이터 모두 클립보드에 저장
    e.clipboardData.setData("text/plain", customData.text);
    e.clipboardData.setData("application/x-nocta-formatted", JSON.stringify(customData));
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>, block: CRDTBlock) => {
    e.preventDefault();

    const customData = e.clipboardData.getData("application/x-nocta-formatted");

    if (customData) {
      const { metadata } = JSON.parse(customData);
      const caretPosition = block.crdt.currentCaret;

      metadata.forEach((char: ClipboardMetadata, index: number) => {
        const insertPosition = caretPosition + index;
        const charNode = block.crdt.localInsert(
          insertPosition,
          char.value,
          block.id,
          pageId,
          char.style,
          char.color,
          char.backgroundColor,
        );
        sendCharInsertOperation({
          node: charNode.node,
          blockId: block.id,
          pageId,
          style: char.style,
          color: char.color,
          backgroundColor: char.backgroundColor,
        });
      });

      editorCRDT.current.currentBlock!.crdt.currentCaret = caretPosition + metadata.length;
    } else {
      const text = e.clipboardData.getData("text/plain");

      if (!block || text.length === 0) return;

      const caretPosition = block.crdt.currentCaret;

      // 텍스트를 한 글자씩 순차적으로 삽입
      text.split("").forEach((char, index) => {
        const insertPosition = caretPosition + index;
        const charNode = block.crdt.localInsert(insertPosition, char, block.id, pageId);
        sendCharInsertOperation({
          node: charNode.node,
          blockId: block.id,
          pageId,
        });
      });

      // 캐럿 위치 업데이트
      editorCRDT.current.currentBlock!.crdt.currentCaret = caretPosition + text.length;
    }

    setEditorState({
      clock: editorCRDT.current.clock,
      linkedList: editorCRDT.current.LinkedList,
    });
  };

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

  useEffect(() => {
    if (!editorCRDT.current.currentBlock) return;
    // TODO: 값이 제대로 들어왔는데 왜 안되는지 확인 필요
    setCaretPosition({
      blockId: editorCRDT.current.currentBlock.id,
      linkedList: editorCRDT.current.LinkedList,
      position: editorCRDT.current.currentBlock?.crdt.currentCaret,
    });
    // 서윤님 피드백 반영
  }, [editorCRDT.current.currentBlock?.id.serialize()]);

  useEffect(() => {
    if (subscriptionRef.current) return;
    subscriptionRef.current = true;

    const unsubscribe = subscribeToRemoteOperations({
      onRemoteBlockInsert: (operation) => {
        console.log(operation, "block : 입력 확인합니다이");
        if (!editorCRDT.current) return;
        editorCRDT.current.remoteInsert(operation);
        setEditorState({
          clock: editorCRDT.current.clock,
          linkedList: editorCRDT.current.LinkedList,
        });
      },

      onRemoteBlockDelete: (operation) => {
        console.log(operation, "block : 삭제 확인합니다이");
        if (!editorCRDT.current) return;
        editorCRDT.current.remoteDelete(operation);
        setEditorState({
          clock: editorCRDT.current.clock,
          linkedList: editorCRDT.current.LinkedList,
        });
      },

      onRemoteCharInsert: (operation) => {
        console.log(operation, "char : 입력 확인합니다이");
        if (!editorCRDT.current) return;
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
        if (!editorCRDT.current) return;
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
        if (!editorCRDT.current) return;
        editorCRDT.current.remoteUpdate(operation.node, operation.pageId);
        setEditorState({
          clock: editorCRDT.current.clock,
          linkedList: editorCRDT.current.LinkedList,
        });
      },

      onRemoteBlockReorder: (operation) => {
        console.log(operation, "block : 재정렬 확인합니다이");
        if (!editorCRDT.current) return;
        editorCRDT.current.remoteReorder(operation);
        setEditorState({
          clock: editorCRDT.current.clock,
          linkedList: editorCRDT.current.LinkedList,
        });
      },

      onRemoteCharUpdate: (operation) => {
        console.log(operation, "char : 업데이트 확인합니다이");
        if (!editorCRDT.current) return;
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
  }, []);

  const addNewBlock = () => {
    const index = editorCRDT.current.LinkedList.spread().length;

    // 로컬 삽입을 수행하고 연산 객체를 반환받음
    const operation = editorCRDT.current.localInsert(index, "");
    editorCRDT.current.currentBlock = operation.node;
    sendBlockInsertOperation({ node: operation.node, pageId });
    setEditorState({
      clock: operation.node.id.clock,
      linkedList: editorCRDT.current.LinkedList,
    });
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
