import { DndContext } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { EditorCRDT } from "@noctaCrdt/Crdt";
import { BlockLinkedList } from "@noctaCrdt/LinkedList";
import { Block as CRDTBlock } from "@noctaCrdt/Node";
import { BlockId } from "@noctaCrdt/NodeId";
import { useRef, useState, useCallback, useEffect } from "react";
import { useSocket } from "@src/apis/useSocket.ts";
import { editorContainer, editorTitleContainer, editorTitle } from "./Editor.style";
import { Block } from "./components/block/Block.tsx";
import { useBlockDragAndDrop } from "./hooks/useBlockDragAndDrop";
import { useMarkdownGrammer } from "./hooks/useMarkdownGrammer";

interface EditorProps {
  onTitleChange: (title: string) => void;
}

export interface EditorStateProps {
  clock: number;
  linkedList: BlockLinkedList;
  currentBlock: BlockId | null;
}

export const Editor = ({ onTitleChange }: EditorProps) => {
  const editorCRDT = useRef<EditorCRDT>(new EditorCRDT(0));
  const { sendInsertOperation, sendDeleteOperation } = useSocket();
  const [editorState, setEditorState] = useState<EditorStateProps>({
    clock: editorCRDT.current.clock,
    linkedList: editorCRDT.current.LinkedList,
    currentBlock: null as BlockId | null,
  });

  const { sensors, handleDragEnd } = useBlockDragAndDrop({
    editorCRDT: editorCRDT.current,
    editorState,
    setEditorState,
  });

  const { handleKeyDown } = useMarkdownGrammer({
    editorCRDT: editorCRDT.current,
    editorState,
    setEditorState,
  });

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onTitleChange(e.target.value);
  };

  const handleBlockClick = (blockId: BlockId, e: React.MouseEvent<HTMLDivElement>) => {
    const block = editorState.linkedList.getNode(blockId);
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
    (e: React.FormEvent<HTMLDivElement>, blockId: BlockId) => {
      const block = editorState.linkedList.getNode(blockId);
      if (!block) return;
      let testNode;
      const element = e.currentTarget;
      const newContent = element.textContent || "";
      const currentContent = block.crdt.read();
      const selection = window.getSelection();
      const caretPosition = selection?.focusOffset || 0;

      if (newContent.length > currentContent.length) {
        if (caretPosition === 0) {
          const [addedChar] = newContent;
          testNode = block.crdt.localInsert(0, addedChar);
          block.crdt.currentCaret = 1;
        } else if (caretPosition > currentContent.length) {
          const addedChar = newContent[newContent.length - 1];
          testNode = block.crdt.localInsert(currentContent.length, addedChar);
          block.crdt.currentCaret = caretPosition;
        } else {
          const addedChar = newContent[caretPosition - 1];
          testNode = block.crdt.localInsert(caretPosition - 1, addedChar);
          block.crdt.currentCaret = caretPosition;
        }
        sendInsertOperation(testNode);
      } else if (newContent.length < currentContent.length) {
        if (caretPosition === 0) {
          testNode = block.crdt.localDelete(0);
          block.crdt.currentCaret = 0;
        } else {
          testNode = block.crdt.localDelete(caretPosition);
          block.crdt.currentCaret = caretPosition;
        }
        console.log(testNode);
        sendDeleteOperation(testNode);
      }

      setEditorState((prev) => ({
        clock: editorCRDT.current.clock,
        linkedList: editorCRDT.current.LinkedList,
        currentBlock: prev.currentBlock,
      }));
    },
    [editorState.linkedList],
  );

  useEffect(() => {
    const initialBlock = new CRDTBlock("", new BlockId(0, 0));
    editorCRDT.current.currentBlock = initialBlock;
    editorCRDT.current.LinkedList.insertById(initialBlock);

    setEditorState({
      clock: editorCRDT.current.clock,
      linkedList: editorCRDT.current.LinkedList,
      currentBlock: initialBlock.id,
    });
  }, []);

  console.log("block list", editorState.linkedList.spread());

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
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
};
