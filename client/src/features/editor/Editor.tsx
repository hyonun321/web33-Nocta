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
import { useRef, useState, useCallback, useEffect } from "react";
import { useSocketStore } from "@src/stores/useSocketStore.ts";
import { setCaretPosition, getAbsoluteCaretPosition } from "@src/utils/caretUtils.ts";
import {
  editorContainer,
  editorTitleContainer,
  editorTitle,
  addNewBlockButton,
} from "./Editor.style";
import { Block } from "./components/block/Block";
import { useBlockDragAndDrop } from "./hooks/useBlockDragAndDrop";
import { useBlockOptionSelect } from "./hooks/useBlockOption";
import { useMarkdownGrammer } from "./hooks/useMarkdownGrammer";
import { useTextOptionSelect } from "./hooks/useTextOptions.ts";

interface EditorProps {
  onTitleChange: (title: string) => void;
  pageId: string;
  serializedEditorData: serializedEditorDataProps | null;
  updatePageData: (pageId: string, newData: serializedEditorDataProps) => void;
}

export interface EditorStateProps {
  clock: number;
  linkedList: BlockLinkedList;
}

export const Editor = ({
  onTitleChange,
  pageId,
  serializedEditorData,
  updatePageData,
}: EditorProps) => {
  const {
    sendCharInsertOperation,
    sendCharDeleteOperation,
    subscribeToRemoteOperations,
    sendBlockInsertOperation,
    sendBlockDeleteOperation,
    sendBlockUpdateOperation,
  } = useSocketStore();
  const { clientId } = useSocketStore();
  const editorRef = useRef<HTMLDivElement | null>(null); // Add ref for the editor
  // editorCRDT를 useState로 관리하여 페이지별로 인스턴스를 분리
  const [editorCRDT, setEditorCRDT] = useState<EditorCRDT>(() => new EditorCRDT(0));

  useEffect(() => {
    let newEditorCRDT;
    if (serializedEditorData) {
      newEditorCRDT = new EditorCRDT(serializedEditorData.client);
      newEditorCRDT.deserialize(serializedEditorData);
    } else {
      newEditorCRDT = new EditorCRDT(clientId ? clientId : 0);
    }
    setEditorCRDT(newEditorCRDT);
  }, [serializedEditorData, clientId]);

  // editorState도 editorCRDT가 변경될 때마다 업데이트
  const [editorState, setEditorState] = useState<EditorStateProps>({
    clock: editorCRDT?.clock || 0,
    linkedList: editorCRDT?.LinkedList || new BlockLinkedList(),
  });

  useEffect(() => {
    if (editorCRDT) {
      setEditorState({
        clock: editorCRDT.clock,
        linkedList: editorCRDT.LinkedList,
      });
    }
  }, [editorCRDT]);

  const { sensors, handleDragEnd } = useBlockDragAndDrop({
    editorCRDT,
    editorState,
    setEditorState,
    pageId,
  });

  const { handleTypeSelect, handleAnimationSelect, handleCopySelect, handleDeleteSelect } =
    useBlockOptionSelect({
      editorCRDT,
      editorState,
      setEditorState,
      pageId,
      sendBlockUpdateOperation,
      sendBlockDeleteOperation,
      sendBlockInsertOperation,
      sendCharInsertOperation,
    });

  const { handleKeyDown } = useMarkdownGrammer({
    editorCRDT,
    editorState,
    setEditorState,
    pageId,
    sendBlockInsertOperation,
    sendBlockDeleteOperation,
    sendBlockUpdateOperation,
    sendCharDeleteOperation,
    sendCharInsertOperation,
    editorRef,
  });

  const { onTextStyleUpdate, onTextColorUpdate, onTextBackgroundColorUpdate } = useTextOptionSelect(
    {
      editorCRDT,
      setEditorState,
      pageId,
    },
  );

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onTitleChange(e.target.value);
  };

  const handleBlockClick = (blockId: BlockId, e: React.MouseEvent<HTMLDivElement>) => {
    if (editorCRDT) {
      const selection = window.getSelection();
      if (!selection) return;

      const clickedElement = (e.target as HTMLElement).closest(
        '[contenteditable="true"]',
      ) as HTMLDivElement;
      if (!clickedElement) return;

      editorCRDT.currentBlock = editorCRDT.LinkedList.nodeMap[JSON.stringify(blockId)];
      const caretPosition = getAbsoluteCaretPosition(clickedElement);

      // 계산된 캐럿 위치 저장
      editorCRDT.currentBlock.crdt.currentCaret = caretPosition;
    }
  };

  const handleBlockInput = useCallback(
    (e: React.FormEvent<HTMLDivElement>, block: CRDTBlock) => {
      if (!block || !editorCRDT) return;
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
        editorCRDT.currentBlock!.crdt.currentCaret = caretPosition;
        sendCharInsertOperation({ node: charNode.node, blockId: block.id, pageId });
      } else if (newContent.length < currentContent.length) {
        // 문자가 삭제된 경우
        // 삭제 위치 계산
        const deletePosition = Math.max(0, caretPosition);
        if (deletePosition >= 0 && deletePosition < currentContent.length) {
          operationNode = block.crdt.localDelete(deletePosition, block.id, pageId);
          sendCharDeleteOperation(operationNode);

          // 캐럿 위치 업데이트
          editorCRDT.currentBlock!.crdt.currentCaret = deletePosition;
        }
      }
      setEditorState({
        clock: editorCRDT.clock,
        linkedList: editorCRDT.LinkedList,
      });

      // 페이지 데이터 업데이트
      // updatePageData(pageId, editorCRDT.serialize());
    },
    [sendCharInsertOperation, sendCharDeleteOperation, editorCRDT, pageId, updatePageData],
  );

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
      updatePageData(pageId, editorCRDT.serialize());
    },
    [editorCRDT, pageId, sendCharInsertOperation, updatePageData],
  );

  const subscriptionRef = useRef(false);

  useEffect(() => {
    if (!editorCRDT || !editorCRDT.currentBlock) return;
    setCaretPosition({
      blockId: editorCRDT.currentBlock.id,
      linkedList: editorCRDT.LinkedList,
      position: editorCRDT.currentBlock?.crdt.currentCaret,
      rootElement: editorRef.current,
    });
    // 서윤님 피드백 반영
  }, [editorCRDT, editorCRDT?.currentBlock?.id.serialize()]);

  useEffect(() => {
    if (!editorCRDT) return;
    if (subscriptionRef.current) return;
    subscriptionRef.current = true;

    const unsubscribe = subscribeToRemoteOperations({
      onRemoteBlockInsert: (operation) => {
        console.log(operation, "block : 입력 확인합니다이");
        if (operation.pageId !== pageId) return;
        editorCRDT.remoteInsert(operation);
        setEditorState({
          clock: editorCRDT.clock,
          linkedList: editorCRDT.LinkedList,
        });
      },

      onRemoteBlockDelete: (operation) => {
        console.log(operation, "block : 삭제 확인합니다이");
        if (operation.pageId !== pageId) return;
        editorCRDT.remoteDelete(operation);
        setEditorState({
          clock: editorCRDT.clock,
          linkedList: editorCRDT.LinkedList,
        });
      },

      onRemoteCharInsert: (operation) => {
        console.log(operation, "char : 입력 확인합니다이");
        if (operation.pageId !== pageId) return;
        const targetBlock = editorCRDT.LinkedList.nodeMap[JSON.stringify(operation.blockId)];
        if (targetBlock) {
          targetBlock.crdt.remoteInsert(operation);
          setEditorState({
            clock: editorCRDT.clock,
            linkedList: editorCRDT.LinkedList,
          });
        }
      },

      onRemoteCharDelete: (operation) => {
        console.log(operation, "char : 삭제 확인합니다이");
        if (operation.pageId !== pageId) return;
        const targetBlock = editorCRDT.LinkedList.nodeMap[JSON.stringify(operation.blockId)];
        if (targetBlock) {
          targetBlock.crdt.remoteDelete(operation);
          setEditorState({
            clock: editorCRDT.clock,
            linkedList: editorCRDT.LinkedList,
          });
        }
      },

      onRemoteBlockUpdate: (operation) => {
        console.log(operation, "block : 업데이트 확인합니다이");
        if (operation.pageId !== pageId) return;
        editorCRDT.remoteUpdate(operation.node, operation.pageId);
        setEditorState({
          clock: editorCRDT.clock,
          linkedList: editorCRDT.LinkedList,
        });
      },

      onRemoteBlockReorder: (operation) => {
        console.log(operation, "block : 재정렬 확인합니다이");
        if (operation.pageId !== pageId) return;
        editorCRDT.remoteReorder(operation);
        setEditorState({
          clock: editorCRDT.clock,
          linkedList: editorCRDT.LinkedList,
        });
      },

      onRemoteCharUpdate: (operation) => {
        console.log(operation, "char : 업데이트 확인합니다이");
        if (!editorCRDT) return;
        const targetBlock = editorCRDT.LinkedList.nodeMap[JSON.stringify(operation.blockId)];
        targetBlock.crdt.remoteUpdate(operation);
        setEditorState({
          clock: editorCRDT.clock,
          linkedList: editorCRDT.LinkedList,
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

  const addNewBlock = () => {
    if (!editorCRDT) return;
    const index = editorCRDT.LinkedList.spread().length;
    const operation = editorCRDT.localInsert(index, "");
    editorCRDT.currentBlock = operation.node;
    sendBlockInsertOperation({ node: operation.node, pageId });
    setEditorState(() => ({
      clock: editorCRDT.clock,
      linkedList: editorCRDT.LinkedList,
    }));
    updatePageData(pageId, editorCRDT.serialize());
  };

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
                isActive={block.id === editorCRDT.currentBlock?.id}
                onInput={handleBlockInput}
                onCompositionEnd={handleCompositionEnd}
                onKeyDown={handleKeyDown}
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
