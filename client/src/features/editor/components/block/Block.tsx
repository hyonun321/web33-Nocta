import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AnimationType, ElementType } from "@noctaCrdt/Interfaces";
import { Block as CRDTBlock } from "@noctaCrdt/Node";
import { BlockId } from "@noctaCrdt/NodeId";
import { motion } from "framer-motion";
import { memo, useRef, useLayoutEffect } from "react";
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
  onCompositionEnd: (e: React.CompositionEvent<HTMLDivElement>, block: CRDTBlock) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  onClick: (blockId: BlockId, e: React.MouseEvent<HTMLDivElement>) => void;
  onAnimationSelect: (blockId: BlockId, animation: AnimationType) => void;
  onTypeSelect: (blockId: BlockId, type: ElementType) => void;
  onCopySelect: (blockId: BlockId) => void;
  onDeleteSelect: (blockId: BlockId) => void;
}

export const Block: React.FC<BlockProps> = memo(
  ({
    id,
    block,
    isActive,
    onInput,
    onCompositionEnd,
    onKeyDown,
    onClick,
    onAnimationSelect,
    onTypeSelect,
    onCopySelect,
    onDeleteSelect,
  }: BlockProps) => {
    console.log("블록 초기화 상태", block);
    const blockRef = useRef<HTMLDivElement>(null);
    const blockCRDTRef = useRef<CRDTBlock>(block);

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

    const handleAnimationSelect = (animation: AnimationType) => {
      onAnimationSelect(block.id, animation);
    };

    const handleTypeSelect = (type: ElementType) => {
      onTypeSelect(block.id, type);
    };

    const handleCopySelect = () => {
      onCopySelect(block.id);
    };

    const handleDeleteSelect = () => {
      onDeleteSelect(block.id);
    };

    return (
      // TODO: eslint 규칙을 수정해야 할까?
      // TODO: ol일때 index 순서 처리
      <motion.div
        ref={setNodeRef}
        className={blockContainerStyle({ isActive })}
        style={{
          transform: CSS.Transform.toString(transform),
          transition,
          opacity: isDragging ? 0.5 : undefined,
        }}
        initial={blockAnimation[block.animation || "none"].initial}
        animate={isAnimationStart && blockAnimation[block.animation || "none"].animate}
        data-group
      >
        <motion.div
          className={contentWrapperStyle()}
          style={{ paddingLeft: `${block.indent * 12}px` }}
        >
          <MenuBlock
            attributes={attributes}
            listeners={listeners}
            onAnimationSelect={handleAnimationSelect}
            onTypeSelect={handleTypeSelect}
            onCopySelect={handleCopySelect}
            onDeleteSelect={handleDeleteSelect}
          />
          <IconBlock type={block.type} index={1} />
          <div
            ref={blockRef}
            onKeyDown={onKeyDown}
            onInput={handleInput}
            onCompositionEnd={(e) => onCompositionEnd(e, block)}
            onClick={(e) => onClick(block.id, e)}
            contentEditable
            suppressContentEditableWarning
            className={textContainerStyle({
              type: block.type,
            })}
          >
            {blockCRDTRef.current.crdt.read()}
          </div>
        </motion.div>
      </motion.div>
    );
  },
);

Block.displayName = "Block";
