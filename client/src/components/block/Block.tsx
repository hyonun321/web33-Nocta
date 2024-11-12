import React, { memo } from "react";
import { cx } from "@styled-system/css";
import { EditorNode } from "../../types/markdown";
import { blockContainer } from "./Block.style";

interface BlockProps {
  node: EditorNode;
  isActive: boolean;
  contentRef?: React.RefObject<HTMLDivElement>;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onCompositionStart: () => void;
  onCompositionEnd: () => void;
  onInput: (e: React.KeyboardEvent) => void;
  onClick: (nodeId: string) => void;
  currentNodeId: string;
}

export const Block: React.FC<BlockProps> = memo(
  ({
    node,
    isActive,
    contentRef,
    onKeyDown,
    onCompositionStart,
    onCompositionEnd,
    onInput,
    onClick,
  }: BlockProps) => {
    const handleClick = (e: React.MouseEvent) => {
      e.preventDefault();
      onClick(node.id);
    };

    // node.type에 따른 스타일 선택
    const getBlockStyle = (type: string) => {
      switch(type) {
        case 'p': return blockContainer.paragraph;
        case 'h1': return blockContainer.heading1;
        case 'h2': return blockContainer.heading2;
        case 'h3': return blockContainer.heading3;
        case 'ul': return blockContainer.unorderedList;
        case 'ol': return blockContainer.orderedList;
        case 'li': return blockContainer.listItem;
        case 'blockquote': return blockContainer.blockquote;
        case 'input': return blockContainer.input;
        default: return blockContainer.base;
      }
    };

    const commonProps = {
      "data-node-id": node.id,
      "data-depth": node.depth,
      onKeyDown,
      onInput,
      onCompositionStart,
      onCompositionEnd,
      onClick: handleClick,
      ref: isActive ? contentRef : undefined,
      contentEditable: true,
      suppressContentEditableWarning: true,
      dangerouslySetInnerHTML: { __html: node.content },
      className: cx(
        getBlockStyle(node.type),
      ),
    };

    return React.createElement(node.type, commonProps);
  },
);

// 메모이제이션을 위한 displayName 설정
Block.displayName = "Block";