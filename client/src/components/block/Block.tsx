import React, { memo } from "react";
import { EditorNode } from "../../types/markdown";
import { blockContainerStyle, listItemStyle } from "./Block.style";

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

    const getPlaceholder = (type: string) => {
      switch (type) {
        case "p":
          return "텍스트를 입력하세요 ...";
        case "h1":
          return "제목 1";
        case "h2":
          return "제목 2";
        case "h3":
          return "제목 3";
        case "li":
          return "리스트 항목";
        case "blockquote":
          return "인용구를 입력하세요";
        default:
          return "텍스트를 입력하세요";
      }
    };

    const commonProps = {
      "data-node-id": node.id,
      "data-depth": node.depth,
      "data-placeholder": getPlaceholder(node.type),
      onKeyDown,
      onInput,
      onCompositionStart,
      onCompositionEnd,
      onClick: handleClick,
      ref: isActive ? contentRef : undefined,
      contentEditable: true,
      suppressContentEditableWarning: true,
      dangerouslySetInnerHTML: { __html: node.content },
      className: blockContainerStyle({ 
        type: node.type,
        isActive,
      }),
    };

    return React.createElement(node.type, commonProps);
  },
);

// 메모이제이션을 위한 displayName 설정
Block.displayName = "Block";
