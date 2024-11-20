import { DndContext } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { BlockCRDT, EditorCRDT } from "@noctaCrdt/Crdt";
import { BlockLinkedList, TextLinkedList, LinkedList } from "@noctaCrdt/LinkedList";
import { Block as CRDTBlock } from "@noctaCrdt/Node";
import { BlockId, CharId } from "@noctaCrdt/NodeId";
import { RemoteCharInsertOperation } from "node_modules/@noctaCrdt/Interfaces.ts";
import { useRef, useState, useCallback, useEffect } from "react";
import { useSocket } from "@src/apis/useSocket.ts";
import { editorContainer, editorTitleContainer, editorTitle } from "./Editor.style";
import { Block } from "./components/block/Block.tsx";
import { useBlockDragAndDrop } from "./hooks/useBlockDragAndDrop";
import { useMarkdownGrammer } from "./hooks/useMarkdownGrammer";

interface EditorProps {
  onTitleChange: (title: string) => void;
  pageId: string;
  editorCRDT: EditorCRDT;
}

export interface EditorStateProps {
  clock: number;
  linkedList: BlockLinkedList;
  currentBlock: BlockId | null;
}

// TODO: pageId, editorCRDT를 props로 받아와야함
export const Editor = ({ onTitleChange, pageId, editorCRDT }: EditorProps) => {
  const { sendCharInsertOperation, sendCharDeleteOperation, subscribeToRemoteOperations } =
    useSocket();
  const [editorState, setEditorState] = useState<EditorCRDT>(() => {
    const editor = new EditorCRDT(editorCRDT.client);
    editor.deserialize(editorCRDT);
    return editor;
  });

  console.log("처음 editorstate:", editorState, typeof editorCRDT);

  const { sensors, handleDragEnd } = useBlockDragAndDrop({
    editorCRDT,
    editorState,
    setEditorState,
  });

  const { handleKeyDown } = useMarkdownGrammer({
    editorCRDT,
    editorState,
    setEditorState,
  });

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onTitleChange(e.target.value);
  };

  const handleBlockClick = (blockId: BlockId, e: React.MouseEvent<HTMLDivElement>) => {
    const block = editorState.LinkedList.getNode(blockId);
    if (!block) return;

    // 클릭된 요소 내에서의 위치를 가져오기 위해
    const range = document.caretRangeFromPoint(e.clientX, e.clientY);
    if (!range) return;

    const selection = window.getSelection();
    if (!selection) return;

    // 새로운 Range로 Selection 설정
    selection.removeAllRanges();
    selection.addRange(range);

    // 현재 캐럿 위치를 저장
    block.crdt.currentCaret = selection.focusOffset;

    setEditorState((prev) => ({
      ...prev,
      currentBlock: blockId,
    }));
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
          charNode = block.crdt.localInsert(0, addedChar, block.id);
          block.crdt.currentCaret = 1;
        } else if (caretPosition > currentContent.length) {
          const addedChar = newContent[newContent.length - 1];
          charNode = block.crdt.localInsert(currentContent.length, addedChar, block.id);
          block.crdt.currentCaret = caretPosition;
        } else {
          const addedChar = newContent[caretPosition - 1];
          charNode = block.crdt.localInsert(caretPosition - 1, addedChar, block.id);
          block.crdt.currentCaret = caretPosition;
        }
        sendCharInsertOperation({ node: charNode.node, blockId: block.id });
      } else if (newContent.length < currentContent.length) {
        // 문자가 삭제된 경우
        operationNode = block.crdt.localDelete(caretPosition, block.id);
        block.crdt.currentCaret = caretPosition;
        console.log("로컬 삭제 연산 송신", operationNode);
        sendCharDeleteOperation(operationNode);
      }

      setEditorState((prev) => ({
        clock: editorCRDT.clock,
        linkedList: editorCRDT.LinkedList,
        currentBlock: prev.currentBlock,
      }));
    },
    [editorState.linkedList, sendCharInsertOperation, sendCharDeleteOperation],
  );

  const subscriptionRef = useRef(false);

  useEffect(() => {
    if (subscriptionRef.current) return;
    subscriptionRef.current = true;

    const unsubscribe = subscribeToRemoteOperations({
      onRemoteBlockInsert: (operation) => {
        if (!editorCRDT) return;
        editorCRDT.remoteInsert(operation);
        setEditorState(editorCRDT);
      },

      onRemoteBlockDelete: (operation) => {
        if (!editorCRDT) return;
        editorCRDT.remoteDelete(operation);
        setEditorState(editorCRDT);
      },

      onRemoteCharInsert: (operation) => {
        if (!editorCRDT) return;
        const targetBlock = editorCRDT.LinkedList.nodeMap[JSON.stringify(operation.blockId)];
        targetBlock.crdt.remoteInsert(operation);
        setEditorState(editorCRDT);
      },

      onRemoteCharDelete: (operation) => {
        if (!editorCRDT) return;
        const targetBlock = editorCRDT.LinkedList.nodeMap[JSON.stringify(operation.blockId)];
        targetBlock.crdt.remoteDelete({ targetId: operation.targetId, clock: operation.clock });
        setEditorState(editorCRDT);
      },

      onRemoteBlockUpdate: (operation) => {
        console.log(operation, "새 블럭 업데이트 수신 ");
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
            items={editorState.LinkedList.spread().map(
              (block) => `${block.id.client}-${block.id.clock}`,
            )}
            strategy={verticalListSortingStrategy}
          >
            {editorState.LinkedList.spread().map((block) => (
              <Block
                key={`${block.id.client}-${block.id.clock}`}
                id={`${block.id.client}-${block.id.clock}`}
                block={block}
                isActive={block.id === editorState.currentBlock?.id}
                onInput={handleBlockInput}
                onKeyDown={handleKeyDown}
                onClick={handleBlockClick}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
};
