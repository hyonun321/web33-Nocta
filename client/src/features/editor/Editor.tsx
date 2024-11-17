import { DndContext } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { EditorCRDT } from "@noctaCrdt/Crdt";
import { BlockLinkedList } from "@noctaCrdt/LinkedList";
import { Block as CRDTBlock } from "@noctaCrdt/Node";
import { BlockId } from "@noctaCrdt/NodeId";
import { useRef, useState, useCallback, useEffect } from "react";
import { Block } from "@src/features/editor/components/Block/Block";
import { useMarkdownGrammer } from "@src/features/editor/hooks/useMarkdownGrammer";
import { editorContainer, editorTitleContainer, editorTitle } from "./Editor.style";
import { useBlockDragAndDrop } from "./hooks/useBlockDragAndDrop";

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

  const handleBlockClick = (blockId: BlockId) => {
    const block = editorState.linkedList.getNode(blockId);
    if (!block) return;

    const selection = window.getSelection();
    if (!selection) return;

    // 클릭한 위치의 offset을 currentCaret으로 저장
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

      const element = e.currentTarget;
      const newContent = element.textContent || "";
      const currentContent = block.crdt.read();
      const selection = window.getSelection();
      const caretPosition = selection?.focusOffset || 0;

      if (newContent.length > currentContent.length) {
        // 텍스트 추가 로직
        if (caretPosition === 0) {
          const [addedChar] = newContent;
          block.crdt.localInsert(0, addedChar);
          block.crdt.currentCaret = 1;
        } else if (caretPosition > currentContent.length) {
          const addedChar = newContent[newContent.length - 1];
          block.crdt.localInsert(currentContent.length, addedChar);
          block.crdt.currentCaret = caretPosition;
        } else {
          const addedChar = newContent[caretPosition - 1];
          block.crdt.localInsert(caretPosition - 1, addedChar);
          block.crdt.currentCaret = caretPosition;
        }
      } else if (newContent.length < currentContent.length) {
        // 텍스트 삭제 로직
        if (caretPosition === 0) {
          block.crdt.localDelete(0);
          block.crdt.currentCaret = 0;
        } else {
          block.crdt.localDelete(caretPosition);
          block.crdt.currentCaret = caretPosition;
        }
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
