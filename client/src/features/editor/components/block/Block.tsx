import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { BlockCRDT } from "@noctaCrdt/Crdt";
import { Block as CRDTBlock } from "@noctaCrdt/Node";
import { BlockId } from "@noctaCrdt/NodeId";
import { memo, useEffect, useRef } from "react";
import { textContainerStyle, blockContainerStyle } from "./Block.style";
import { IconBlock } from "./IconBlock";
import { MenuBlock } from "./MenuBlock";

interface BlockProps {
  id: string;
  block: CRDTBlock;
  isActive: boolean;
  onInput: (e: React.FormEvent<HTMLDivElement>, blockId: BlockId) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  onClick: (blockId: BlockId) => void;
}

export const Block: React.FC<BlockProps> = memo(
  ({ id, block, isActive, onInput, onKeyDown, onClick }: BlockProps) => {
    const textCRDT = useRef<BlockCRDT>(block.crdt);
    const blockRef = useRef<HTMLDivElement>(null);

    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
      id,
      data: {
        type: "block",
        block,
      },
    });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      paddingLeft: `${block.indent * 12}px`,
      opacity: isDragging ? 0.5 : 1,
      position: "relative" as const,
    };

    const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
      onInput(e, block.id);
    };

    const handleClick = (e: React.MouseEvent) => {
      e.preventDefault();
      onClick(block.id);
    };

    useEffect(() => {
      if (blockRef.current && isActive) {
        const selection = window.getSelection();
        if (!selection) return;

        const range = document.createRange();
        const content =
          blockRef.current.firstChild || blockRef.current.appendChild(document.createTextNode(""));
        const position = Math.min(textCRDT.current.currentCaret, content.textContent?.length || 0);
        range.setStart(content, position);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }, [isActive, blockRef.current?.textContent]);

    return (
      // TODO: eslint 규칙을 수정해야 할까?
      // TODO: ol일때 index 순서 처리
      <div
        ref={setNodeRef}
        className={blockContainerStyle({ isActive })}
        style={style}
        data-group // indent에 따른 마진
      >
        <MenuBlock attributes={attributes} listeners={listeners} />
        <IconBlock type={block.type} index={1} />
        <div
          ref={blockRef}
          onKeyDown={onKeyDown}
          onInput={handleInput}
          onClick={handleClick}
          contentEditable
          suppressContentEditableWarning
          className={textContainerStyle({
            type: block.type,
          })}
        >
          {block.crdt.read()}
        </div>
      </div>
    );

    // return React.createElement(nodeType, commonProps);
  },
);

// 메모이제이션을 위한 displayName 설정
Block.displayName = "Block";
