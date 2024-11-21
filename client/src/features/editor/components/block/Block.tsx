import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Block as CRDTBlock } from "@noctaCrdt/Node";
import { BlockId } from "@noctaCrdt/NodeId";
import { memo, useRef, useLayoutEffect } from "react";
import { IconBlock } from "../IconBlock/IconBlock";
import { MenuBlock } from "../MenuBlock/MenuBlock";
import { textContainerStyle, blockContainerStyle, contentWrapperStyle } from "./Block.style";

interface BlockProps {
  id: string;
  block: CRDTBlock;
  isActive: boolean;
  onInput: (e: React.FormEvent<HTMLDivElement>, block: CRDTBlock) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  onClick: (blockId: BlockId, e: React.MouseEvent<HTMLDivElement>) => void;
}

export const Block: React.FC<BlockProps> = memo(
  ({ id, block, isActive, onInput, onKeyDown, onClick }: BlockProps) => {
    console.log("블록 초기화 상태", block);
    const blockRef = useRef<HTMLDivElement>(null);
    const blockCRDTRef = useRef<CRDTBlock>(block);

    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
      id,
      data: {
        type: "block",
        block,
      },
    });

    const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
      onInput(e, block);
    };

    const setFocusAndCursor = () => {
      if (blockRef.current && isActive) {
        const selection = window.getSelection();
        if (!selection) return;
        const range = document.createRange();
        const content =
          blockRef.current.firstChild || blockRef.current.appendChild(document.createTextNode(""));
        // const position = Math.min(block.crdt.currentCaret, content.textContent?.length || 0);
        const position = Math.min(
          blockCRDTRef.current.crdt.currentCaret,
          content.textContent?.length || 0,
        );
        range.setStart(content, position);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    };

    useLayoutEffect(() => {
      // ✅ 추가
      setFocusAndCursor();
      // block.crdt.currentCaret
    }, [isActive, blockCRDTRef.current.crdt.currentCaret]);

    return (
      // TODO: eslint 규칙을 수정해야 할까?
      // TODO: ol일때 index 순서 처리
      <div
        ref={setNodeRef}
        className={blockContainerStyle({ isActive })}
        style={{
          transform: CSS.Transform.toString(transform),
          transition,
          opacity: isDragging ? 0.5 : 1,
        }}
        data-group // indent에 따른 마진
      >
        <div className={contentWrapperStyle()} style={{ paddingLeft: `${block.indent * 12}px` }}>
          <MenuBlock attributes={attributes} listeners={listeners} />
          <IconBlock type={block.type} index={1} />
          <div
            ref={blockRef}
            onKeyDown={onKeyDown}
            onInput={handleInput}
            onClick={(e) => onClick(block.id, e)}
            contentEditable
            suppressContentEditableWarning
            className={textContainerStyle({
              type: block.type,
            })}
          >
            {blockCRDTRef.current.crdt.read()}
          </div>
        </div>
      </div>
    );

    // return React.createElement(nodeType, commonProps);
  },
);

// 메모이제이션을 위한 displayName 설정
Block.displayName = "Block";
