import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AnimationType, ElementType, TextStyleType } from "@noctaCrdt/Interfaces";
import { Block as CRDTBlock, Char } from "@noctaCrdt/Node";
import { BlockId } from "@noctaCrdt/NodeId";
import { motion } from "framer-motion";
import { memo, useRef, useState } from "react";
import { useModal } from "@src/components/modal/useModal";
import { useBlockAnimation } from "../../hooks/useBlockAnimtaion";
import { IconBlock } from "../IconBlock/IconBlock";
import { MenuBlock } from "../MenuBlock/MenuBlock";
import { TextOptionModal } from "../TextOptionModal/TextOptionModal";
import { blockAnimation } from "./Block.animation";
import { textContainerStyle, blockContainerStyle, contentWrapperStyle } from "./Block.style";

interface BlockProps {
  id: string;
  block: CRDTBlock;
  isActive: boolean;
  onInput: (e: React.FormEvent<HTMLDivElement>, block: CRDTBlock) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  onClick: (blockId: BlockId) => void;
  onAnimationSelect: (blockId: BlockId, animation: AnimationType) => void;
  onTypeSelect: (blockId: BlockId, type: ElementType) => void;
  onCopySelect: (blockId: BlockId) => void;
  onDeleteSelect: (blockId: BlockId) => void;
  onTextStyleUpdate: (styleType: TextStyleType, blockId: BlockId, nodes: Array<Char>) => void;
}
export const Block: React.FC<BlockProps> = memo(
  ({
    id,
    block,
    isActive,
    onInput,
    onKeyDown,
    onClick,
    onAnimationSelect,
    onTypeSelect,
    onCopySelect,
    onDeleteSelect,
    onTextStyleUpdate,
  }: BlockProps) => {
    const blockRef = useRef<HTMLDivElement>(null);
    const blockCRDTRef = useRef<CRDTBlock>(block);
    const { isOpen, openModal, closeModal } = useModal();
    const [selectedNodes, setSelectedNodes] = useState<Array<Char> | null>(null);
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

    const handleMouseUp = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || !blockRef.current) {
        setSelectedNodes(null);
        closeModal();
        return;
      }

      const range = selection.getRangeAt(0);
      if (!blockRef.current.contains(range.commonAncestorContainer)) {
        setSelectedNodes(null);
        closeModal();
        return;
      }

      const nodes = blockCRDTRef.current.crdt.LinkedList.getNodesBetween(
        range.startOffset,
        range.endOffset,
      );

      if (nodes.length > 0) {
        setSelectedNodes(nodes);
        openModal();
      }
    };

    const handleStyleSelect = (styleType: TextStyleType) => {
      if (selectedNodes) {
        onTextStyleUpdate(styleType, block.id, selectedNodes);
        closeModal();
      }
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
            onClick={() => onClick(block.id)}
            onMouseUp={handleMouseUp}
            contentEditable
            suppressContentEditableWarning
            className={textContainerStyle({
              type: block.type,
            })}
          >
            {blockCRDTRef.current.crdt.read()}
          </div>
        </motion.div>
        <TextOptionModal
          isOpen={isOpen}
          onClose={closeModal}
          onBoldSelect={() => handleStyleSelect("bold")}
          onItalicSelect={() => handleStyleSelect("italic")}
          onUnderlineSelect={() => handleStyleSelect("underline")}
          onStrikeSelect={() => handleStyleSelect("strikethrough")}
        />
      </motion.div>
    );
  },
);

Block.displayName = "Block";
