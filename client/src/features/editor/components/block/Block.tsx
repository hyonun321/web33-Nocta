import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { BlockCRDT } from "@noctaCrdt/Crdt";
import { Block as CRDTBlock } from "@noctaCrdt/Node";
import { BlockId } from "@noctaCrdt/NodeId";
import { motion } from "framer-motion";
import { memo, useEffect, useRef, useState } from "react";
import { useBlockAnimation } from "../../hooks/useBlockAnimtaion";
import { IconBlock } from "../IconBlock/IconBlock";
import { MenuBlock } from "../MenuBlock/MenuBlock";
import { blockAnimation } from "./Block.animation";
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
    const textCRDT = useRef<BlockCRDT>(block.crdt);
    const blockRef = useRef<HTMLDivElement>(null);

    const { isAnimationStart } = useBlockAnimation(blockRef);
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
        const position = Math.min(textCRDT.current.currentCaret, content.textContent?.length || 0);
        range.setStart(content, position);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    };

    requestAnimationFrame(() => {
      // ✅ 추가
      setFocusAndCursor();
    });

    return (
      // TODO: eslint 규칙을 수정해야 할까?
      // TODO: ol일때 index 순서 처리
      <motion.div
        ref={setNodeRef}
        className={blockContainerStyle({ isActive })}
        style={{
          transform: CSS.Transform.toString(transform),
          transition,
          opacity: isDragging ? 0.5 : 1,
        }}
        initial={block?.animation && blockAnimation.highlight.initial}
        animate={isAnimationStart && block?.animation && blockAnimation.highlight.animate}
        data-group
      >
        <motion.div
          className={contentWrapperStyle()}
          style={{ paddingLeft: `${block.indent * 12}px` }}
        >
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
            {block.crdt.read()}
          </div>
        </motion.div>
      </motion.div>
    );
  },
);

// 메모이제이션을 위한 displayName 설정
Block.displayName = "Block";
