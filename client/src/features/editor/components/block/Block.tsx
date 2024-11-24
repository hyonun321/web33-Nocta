import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AnimationType, ElementType, TextStyleType } from "@noctaCrdt/Interfaces";
import { Block as CRDTBlock, Char } from "@noctaCrdt/Node";
import { BlockId } from "@noctaCrdt/NodeId";
import { motion } from "framer-motion";
import { memo, useEffect, useRef, useState } from "react";
import { useModal } from "@src/components/modal/useModal";
import { setCaretPosition, getAbsoluteCaretPosition } from "@src/utils/caretUtils";
import { useBlockAnimation } from "../../hooks/useBlockAnimtaion";
import { setInnerHTML } from "../../utils/domSyncUtils";
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
  onTextStyleUpdate: (
    styleType: TextStyleType,
    blockId: BlockId,
    nodes: Array<Char> | null,
  ) => void;
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

      // 실제 텍스트 위치 계산
      const getTextOffset = (container: Node, offset: number): number => {
        let totalOffset = 0;
        const walker = document.createTreeWalker(blockRef.current!, NodeFilter.SHOW_TEXT, null);

        let node = walker.nextNode();
        while (node) {
          if (node === container) {
            return totalOffset + offset;
          }
          if (node.compareDocumentPosition(container) & Node.DOCUMENT_POSITION_FOLLOWING) {
            totalOffset += node.textContent?.length || 0;
          }
          node = walker.nextNode();
        }
        return totalOffset;
      };

      const startOffset = getTextOffset(range.startContainer, range.startOffset);
      const endOffset = getTextOffset(range.endContainer, range.endOffset);

      const nodes = block.crdt.LinkedList.spread().slice(startOffset, endOffset);
      console.log("nodes", nodes);
      if (nodes.length > 0) {
        setSelectedNodes(nodes);
        openModal();
      }
    };

    const handleStyleSelect = (styleType: TextStyleType) => {
      if (blockRef.current && selectedNodes) {
        const selection = window.getSelection();
        // CRDT 상태 업데이트 및 서버 전송
        onTextStyleUpdate(styleType, block.id, selectedNodes);

        const position = selection?.focusOffset || 0;
        block.crdt.currentCaret = position;

        closeModal();
      }
    };

    useEffect(() => {
      if (blockRef.current) {
        setInnerHTML({ element: blockRef.current, block });
      }
    }, [block.crdt.serialize(), isActive]);

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
            spellCheck={false}
            suppressContentEditableWarning
            className={textContainerStyle({
              type: block.type,
            })}
          />
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
