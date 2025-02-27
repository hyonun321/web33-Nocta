import { useSortable } from "@dnd-kit/sortable";
import {
  AnimationType,
  ElementType,
  TextColorType,
  TextStyleType,
  BackgroundColorType,
} from "@noctaCrdt/Interfaces";
import { Block as CRDTBlock, Char } from "@noctaCrdt/Node";
import { BlockId } from "@noctaCrdt/NodeId";
import { motion } from "framer-motion";
import { memo, useEffect, useRef, useState } from "react";
import { useModal } from "@src/components/modal/useModal";
import { getAbsoluteCaretPosition } from "@src/utils/caretUtils";
import { useBlockAnimation } from "../../hooks/useBlockAnimtaion";
import { setInnerHTML, getTextOffset } from "../../utils/domSyncUtils";
import { IconBlock } from "../IconBlock/IconBlock";
import { MenuBlock } from "../MenuBlock/MenuBlock";
import { TextOptionModal } from "../TextOptionModal/TextOptionModal";
import { TypeOptionModal } from "../TypeOptionModal/TypeOptionModal";
import { blockAnimation } from "./Block.animation";
import {
  textContainerStyle,
  blockContainerStyle,
  contentWrapperStyle,
  dropIndicatorStyle,
} from "./Block.style";

interface BlockProps {
  id: string;
  block: CRDTBlock;
  dragBlockList: string[];
  isActive: boolean;
  onInput: (e: React.FormEvent<HTMLDivElement>, block: CRDTBlock) => void;
  onCompositionStart: (e: React.CompositionEvent<HTMLDivElement>, block: CRDTBlock) => void;
  onCompositionUpdate: (e: React.CompositionEvent<HTMLDivElement>, block: CRDTBlock) => void;
  onCompositionEnd: (e: React.CompositionEvent<HTMLDivElement>, block: CRDTBlock) => void;
  onKeyDown: (
    e: React.KeyboardEvent<HTMLDivElement>,
    blockRef: HTMLDivElement | null,
    block: CRDTBlock,
  ) => void;
  onCopy: (
    e: React.ClipboardEvent<HTMLDivElement>,
    blockRef: HTMLDivElement | null,
    block: CRDTBlock,
  ) => void;
  onPaste: (
    e: React.ClipboardEvent<HTMLDivElement>,
    blockRef: HTMLDivElement | null,
    block: CRDTBlock,
  ) => void;
  onClick: (blockId: BlockId, e: React.MouseEvent<HTMLDivElement>) => void;
  onAnimationSelect: (blockId: BlockId, animation: AnimationType) => void;
  onTypeSelect: (blockId: BlockId, type: ElementType) => void;
  onCopySelect: (blockId: BlockId) => void;
  onDeleteSelect: (blockId: BlockId) => void;
  onTextStyleUpdate: (
    styleType: TextStyleType,
    blockId: BlockId,
    nodes: Array<Char> | null,
  ) => void;
  onTextColorUpdate: (color: TextColorType, blockId: BlockId, nodes: Array<Char>) => void;
  onTextBackgroundColorUpdate: (
    color: BackgroundColorType,
    blockId: BlockId,
    nodes: Array<Char>,
  ) => void;
  onCheckboxToggle: (blockId: BlockId, isChecked: boolean) => void;
}
export const Block: React.FC<BlockProps> = memo(
  ({
    id,
    block,
    dragBlockList,
    isActive,
    onInput,
    onCompositionStart,
    onCompositionUpdate,
    onCompositionEnd,
    onKeyDown,
    onCopy,
    onPaste,
    onClick,
    onAnimationSelect,
    onTypeSelect,
    onCopySelect,
    onDeleteSelect,
    onTextStyleUpdate,
    onTextColorUpdate,
    onTextBackgroundColorUpdate,
    onCheckboxToggle,
  }: BlockProps) => {
    const blockRef = useRef<HTMLDivElement>(null);
    const { isOpen, openModal, closeModal } = useModal();
    const [selectedNodes, setSelectedNodes] = useState<Array<Char> | null>(null);
    const { isAnimationStart } = useBlockAnimation(blockRef);
    const { attributes, listeners, setNodeRef, isDragging, isOver, activeIndex, overIndex, data } =
      useSortable({
        id,
        data: {
          id,
          type: "block",
          block,
        },
      });

    // 현재 드래그 중인 부모 블록의 indent 확인
    const isChildOfDragging = dragBlockList.some((item) => item === data.id);

    // NOTE 드롭 인디케이터 위치 계산
    // 현재 over 중인 블럭 위치 + 위/아래로 모두 인디케이터 표시 + 부모요소는 자식요소 내부로는 이동하지 못함
    const showTopIndicator = isOver && !isChildOfDragging && activeIndex >= overIndex;
    const showBottomIndicator = isOver && !isChildOfDragging && activeIndex < overIndex;

    const [slashModalOpen, setSlashModalOpen] = useState(false);
    const [slashModalPosition, setSlashModalPosition] = useState({ top: 0, left: 0 });

    const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
      // 텍스트를 삭제하면 <br> 태그가 생김
      // 이를 방지하기 위해 <br> 태그 찾아서 모두 삭제
      const brElements = e.currentTarget.getElementsByTagName("br");
      if (brElements.length > 0) {
        e.preventDefault();
        Array.from(brElements).forEach((br) => br.remove());
      }

      const caretPosition = getAbsoluteCaretPosition(e.currentTarget);
      block.crdt.currentCaret = caretPosition;

      const element = e.currentTarget;
      const newContent = element.textContent || "";

      if (newContent === "/" && !slashModalOpen) {
        const rect = e.currentTarget.getBoundingClientRect();
        setSlashModalPosition({
          top: rect.top,
          left: rect.left + 0,
        });
        setSlashModalOpen(true);
      } else {
        onInput(e, block);
      }
    };

    const handleKeyDown = (
      e: React.KeyboardEvent<HTMLDivElement>,
      blockRef: HTMLDivElement | null,
      block: CRDTBlock,
    ) => {
      switch (e.key) {
        case e.metaKey && "b": {
          e.preventDefault();
          onTextStyleUpdate("bold", block.id, selectedNodes);
          break;
        }
        case e.metaKey && "i": {
          e.preventDefault();
          onTextStyleUpdate("italic", block.id, selectedNodes);
          break;
        }
        case e.metaKey && "u": {
          e.preventDefault();
          onTextStyleUpdate("underline", block.id, selectedNodes);
          break;
        }
        case e.metaKey && "Shift" && "s": {
          onTextStyleUpdate("strikethrough", block.id, selectedNodes);
          e.preventDefault();
          break;
        }
        default: {
          onKeyDown(e, blockRef, block);
          break;
        }
      }
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

      const startOffset = getTextOffset(blockRef.current, range.startContainer, range.startOffset);
      const endOffset = getTextOffset(blockRef.current, range.endContainer, range.endOffset);

      const nodes = block.crdt.LinkedList.spread().slice(startOffset, endOffset);
      if (nodes.length > 0) {
        setSelectedNodes(nodes);
        openModal();
      }
      block.crdt.currentCaret = endOffset;
    };

    const handleStyleSelect = (styleType: TextStyleType) => {
      if (blockRef.current && selectedNodes) {
        // CRDT 상태 업데이트 및 서버 전송
        onTextStyleUpdate(styleType, block.id, selectedNodes);

        const position = getAbsoluteCaretPosition(blockRef.current);
        block.crdt.currentCaret = position;

        closeModal();
      }
    };

    const handleTextColorSelect = (color: TextColorType) => {
      if (blockRef.current && selectedNodes) {
        onTextColorUpdate(color, block.id, selectedNodes);

        const position = getAbsoluteCaretPosition(blockRef.current);
        block.crdt.currentCaret = position;

        closeModal();
      }
    };

    const handleTextBackgroundColorSelect = (color: BackgroundColorType) => {
      if (blockRef.current && selectedNodes) {
        onTextBackgroundColorUpdate(color, block.id, selectedNodes);

        const position = getAbsoluteCaretPosition(blockRef.current);
        block.crdt.currentCaret = position;

        closeModal();
      }
    };

    const handleCheckboxClick = () => {
      onCheckboxToggle(block.id, !block.isChecked);
    };

    const Indicator = () => (
      <div
        className={dropIndicatorStyle({
          indent: block.indent === 0 ? "first" : block.indent === 1 ? "second" : "third",
        })}
      />
    );

    useEffect(() => {
      if (blockRef.current) {
        setInnerHTML({ element: blockRef.current, block });
      }
    }, [block.crdt.serialize()]);

    return (
      // TODO: eslint 규칙을 수정해야 할까?
      // TODO: ol일때 index 순서 처리
      <div style={{ position: "relative" }}>
        {showTopIndicator && <Indicator />}
        <motion.div
          ref={setNodeRef}
          className={blockContainerStyle({ isActive })}
          style={{ opacity: isDragging || isChildOfDragging ? 0.3 : undefined }}
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

            <IconBlock
              type={block.type}
              index={block.listIndex}
              indent={block.indent}
              isChecked={block.isChecked}
              onCheckboxClick={handleCheckboxClick}
            />
            <div
              ref={blockRef}
              onKeyDown={(e) => handleKeyDown(e, blockRef.current, block)}
              onInput={handleInput}
              onClick={(e) => onClick(block.id, e)}
              onCopy={(e) => onCopy(e, blockRef.current, block)}
              onPaste={(e) => onPaste(e, blockRef.current, block)}
              onMouseUp={handleMouseUp}
              onCompositionStart={(e) => onCompositionStart(e, block)}
              onCompositionUpdate={(e) => onCompositionUpdate(e, block)}
              onCompositionEnd={(e) => onCompositionEnd(e, block)}
              contentEditable={block.type !== "hr"}
              spellCheck={false}
              suppressContentEditableWarning
              className={textContainerStyle({
                type: block.type,
              })}
            />
          </motion.div>
          <TextOptionModal
            selectedNodes={selectedNodes}
            isOpen={isOpen}
            onClose={closeModal}
            onBoldSelect={() => handleStyleSelect("bold")}
            onItalicSelect={() => handleStyleSelect("italic")}
            onUnderlineSelect={() => handleStyleSelect("underline")}
            onStrikeSelect={() => handleStyleSelect("strikethrough")}
            onTextColorSelect={handleTextColorSelect}
            onTextBackgroundColorSelect={handleTextBackgroundColorSelect}
          />
          <TypeOptionModal
            isOpen={slashModalOpen}
            onClose={() => setSlashModalOpen(false)}
            onTypeSelect={(type) => handleTypeSelect(type)}
            position={slashModalPosition}
          />
        </motion.div>
        {showBottomIndicator && <Indicator />}
      </div>
    );
  },
);

Block.displayName = "Block";
