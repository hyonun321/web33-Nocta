import { useRef, useState, useCallback, useEffect } from "react";
import { EditorState } from "../../types/markdown";
import { Block } from "@components/block/Block";
import { useCaretManager } from "../../hooks/useCaretManager";
import { LinkedListBlock } from "../../utils/linkedLIstBlock";
import { checkMarkdownPattern } from "../../utils/markdownPatterns";
import { useKeyboardHandlers } from "../../hooks/useMarkdownGrammer";
import { editorContainer, editorTitleContainer } from "./Editor.style";

interface EditorProps {
  onTitleChange: (title: string) => void;
}

export const Editor = ({ onTitleChange }: EditorProps) => {
  const [editorList] = useState(() => new LinkedListBlock());
  const [editorState, setEditorState] = useState<EditorState>(() => ({
    rootNode: editorList.root,
    currentNode: editorList.current,
  }));
  const [isComposing, setIsComposing] = useState(false);

  const contentRef = useRef<HTMLDivElement | null>(null);
  const { setCaretPosition } = useCaretManager();

  const { handleKeyDown } = useKeyboardHandlers({
    editorState,
    editorList,
    setEditorState,
    checkMarkdownPattern,
  });

  const handleBlockClick = useCallback(
    (nodeId: string) => {
      const node = editorList.findNodeById(nodeId);
      if (node) {
        setEditorState((prev) => ({
          ...prev,
          currentNode: node,
        }));
      }
    },
    [editorList],
  );

  const handleCompositionStart = useCallback(() => {
    setIsComposing(true);
  }, []);

  const handleCompositionEnd = useCallback(() => {
    setIsComposing(false);
  }, []);

  const handleInput = useCallback(() => {
    if (isComposing) return;

    if (contentRef.current && editorState.currentNode) {
      const newContent = contentRef.current.textContent || "";
      editorState.currentNode.content = newContent;
    }
  }, [editorState.currentNode, isComposing]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onTitleChange(e.target.value);
  };

  useEffect(() => {
    if (editorState.currentNode) {
      requestAnimationFrame(() => {
        const element = document.querySelector(
          `[data-node-id="${editorState.currentNode!.id}"]`,
        ) as HTMLElement;
        if (element) {
          contentRef.current = element as HTMLDivElement;
          const caretPosition = element.textContent?.length || 0;
          setCaretPosition(element, caretPosition);
        }
      });
    }
  }, [editorState.currentNode!.id, editorState.currentNode?.type, setCaretPosition]);

  const renderNodes = () => {
    const nodes = editorList.traverseNodes();
    return nodes.map((node) => {
      if (node.type === "li") return null;
      if (node.type === "ul" || node.type === "ol") {
        const children = [];
        let child = node.firstChild;
        while (child && child.parentNode === node) {
          children.push(child);
          child = child.nextSibling;
        }

        return (
          <node.type 
            key={node.id} 
          >
            {children.map((liNode) => (
              <Block
                key={liNode.id}
                node={liNode}
                isActive={liNode === editorState.currentNode}
                contentRef={liNode === editorState.currentNode ? contentRef : undefined}
                currentNodeId={editorState.currentNode?.id || ""}
                onKeyDown={handleKeyDown}
                onCompositionStart={handleCompositionStart}
                onCompositionEnd={handleCompositionEnd}
                onInput={handleInput}
                onClick={handleBlockClick}
              />
            ))}
          </node.type>
        );
      }

      return (
        <Block
          key={node.id}
          node={node}
          isActive={node === editorState.currentNode}
          contentRef={node === editorState.currentNode ? contentRef : undefined}
          currentNodeId={editorState.currentNode?.id || ""}
          onKeyDown={handleKeyDown}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          onInput={handleInput}
          onClick={handleBlockClick}
        />
      );
    });
  };

  return (
    <div className={editorContainer}>
      <input
        type="text"
        placeholder="제목을 입력하세요..."
        onChange={handleTitleChange}
        className={editorTitleContainer}
      />
      {renderNodes()}
    </div>
  );
};
