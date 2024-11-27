import { EditorCRDT } from "@noctaCrdt/Crdt";
import { RemoteCharInsertOperation } from "@noctaCrdt/Interfaces";
import { Block } from "@noctaCrdt/Node";
import { BlockId } from "@noctaCrdt/NodeId";
import { useCallback } from "react";
import { useSocketStore } from "@src/stores/useSocketStore";
import { getAbsoluteCaretPosition } from "@src/utils/caretUtils";
import { EditorStateProps } from "../Editor";
import { getTextOffset } from "../utils/domSyncUtils";

interface UseBlockOperationProps {
  editorCRDT: EditorCRDT;
  pageId: string;
  setEditorState: React.Dispatch<React.SetStateAction<EditorStateProps>>;
  onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  handleHrInput: (block: Block, content: string) => boolean;
}

export const useBlockOperation = ({
  editorCRDT,
  pageId,
  setEditorState,
  onKeyDown,
  handleHrInput,
}: UseBlockOperationProps) => {
  const { sendCharInsertOperation, sendCharDeleteOperation } = useSocketStore();

  const handleBlockClick = useCallback(
    (blockId: BlockId, e: React.MouseEvent<HTMLDivElement>) => {
      if (editorCRDT) {
        const selection = window.getSelection();
        if (!selection) return;

        const clickedElement = (e.target as HTMLElement).closest(
          '[contenteditable="true"]',
        ) as HTMLDivElement;
        if (!clickedElement) return;

        editorCRDT.currentBlock = editorCRDT.LinkedList.nodeMap[JSON.stringify(blockId)];
        const caretPosition = getAbsoluteCaretPosition(clickedElement);

        // 계산된 캐럿 위치 저장
        editorCRDT.currentBlock.crdt.currentCaret = caretPosition;
      }
    },
    [editorCRDT],
  );

  const handleBlockInput = useCallback(
    (e: React.FormEvent<HTMLDivElement>, block: Block) => {
      if (!block || !editorCRDT) return;
      if ((e.nativeEvent as InputEvent).isComposing) {
        return;
      }

      // 드래그 선택 상태 확인
      const selection = window.getSelection();
      if (selection && !selection.isCollapsed) {
        // 드래그 선택된 상태면 input 이벤트 무시
        console.log("dragging");
        e.preventDefault();
        return;
      }

      let operationNode;
      const element = e.currentTarget;
      const newContent = element.textContent || "";
      const currentContent = block.crdt.read();
      const caretPosition = getAbsoluteCaretPosition(element);

      if (handleHrInput(block, newContent)) {
        return;
      }

      if (newContent.length > currentContent.length) {
        let charNode: RemoteCharInsertOperation;
        // 캐럿 위치 유효성 검사
        const validCaretPosition = Math.min(Math.max(0, caretPosition), currentContent.length);
        // 맨 앞에 삽입
        if (caretPosition === 0) {
          const [addedChar] = newContent;
          charNode = block.crdt.localInsert(0, addedChar, block.id, pageId);
        } else if (caretPosition > currentContent.length) {
          // 맨 뒤에 삽입
          let prevChar;
          if (currentContent.length > 0) {
            prevChar = editorCRDT.currentBlock?.crdt.LinkedList.findByIndex(
              currentContent.length - 1,
            );
          }
          const addedChar = newContent[newContent.length - 1];
          charNode = block.crdt.localInsert(
            currentContent.length,
            addedChar,
            block.id,
            pageId,
            prevChar ? prevChar.style : [],
            prevChar ? prevChar.color : undefined,
            prevChar ? prevChar.backgroundColor : undefined,
          );
        } else {
          // 중간에 삽입
          const prevChar = editorCRDT.currentBlock?.crdt.LinkedList.findByIndex(
            validCaretPosition - 1,
          );
          const addedChar = newContent[validCaretPosition - 1];
          charNode = block.crdt.localInsert(
            validCaretPosition - 1,
            addedChar,
            block.id,
            pageId,
            prevChar?.style,
            prevChar?.color,
            prevChar?.backgroundColor,
          );
        }
        editorCRDT.currentBlock!.crdt.currentCaret = caretPosition;
        sendCharInsertOperation({ node: charNode.node, blockId: block.id, pageId });
      } else if (newContent.length < currentContent.length) {
        // 문자가 삭제된 경우
        // 삭제 위치 계산
        const deletePosition = Math.max(0, caretPosition);
        if (deletePosition >= 0 && deletePosition < currentContent.length) {
          operationNode = block.crdt.localDelete(deletePosition, block.id, pageId);
          sendCharDeleteOperation(operationNode);

          // 캐럿 위치 업데이트
          editorCRDT.currentBlock!.crdt.currentCaret = deletePosition;
        }
      }
      setEditorState({
        clock: editorCRDT.clock,
        linkedList: editorCRDT.LinkedList,
      });
    },
    [sendCharInsertOperation, sendCharDeleteOperation, editorCRDT, pageId],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>, blockRef: HTMLDivElement | null, block: Block) => {
      if (!blockRef || !block) return;
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || !blockRef) {
        // 선택된 텍스트가 없으면 기존 onKeyDown 로직 실행
        onKeyDown(e);
        return;
      }

      const isCharacterKey = e.key.length === 1 && !e.ctrlKey && !e.metaKey;

      if (e.key === "Backspace" || isCharacterKey) {
        e.preventDefault();

        const range = selection.getRangeAt(0);
        if (!blockRef.contains(range.commonAncestorContainer)) return;

        const startOffset = getTextOffset(blockRef, range.startContainer, range.startOffset);
        const endOffset = getTextOffset(blockRef, range.endContainer, range.endOffset);

        // 선택된 범위의 문자들을 역순으로 삭제
        for (let i = endOffset - 1; i >= startOffset; i--) {
          const operationNode = block.crdt.localDelete(i, block.id, pageId);
          sendCharDeleteOperation(operationNode);
        }

        if (isCharacterKey) {
          sendCharInsertOperation(block.crdt.localInsert(startOffset, e.key, block.id, pageId));
        }

        block.crdt.currentCaret = startOffset + (isCharacterKey ? 1 : 0);
        setEditorState({
          clock: editorCRDT.clock,
          linkedList: editorCRDT.LinkedList,
        });
      } else {
        onKeyDown(e);
      }
    },
    [editorCRDT.LinkedList, sendCharDeleteOperation, pageId, onKeyDown],
  );

  return {
    handleBlockClick,
    handleBlockInput,
    handleKeyDown,
  };
};
