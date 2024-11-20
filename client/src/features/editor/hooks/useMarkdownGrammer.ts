import { EditorCRDT, BlockCRDT } from "@noctaCrdt/Crdt";
import {
  RemoteBlockInsertOperation,
  RemoteBlockDeleteOperation,
  RemoteBlockUpdateOperation,
  RemoteCharInsertOperation,
  RemoteCharDeleteOperation,
} from "@noctaCrdt/Interfaces";
import { BlockLinkedList } from "@noctaCrdt/LinkedList";
import { BlockId } from "@noctaCrdt/NodeId";
import { useCallback } from "react";
import { EditorStateProps } from "@features/editor/Editor";
import { checkMarkdownPattern } from "@src/features/editor/utils/markdownPatterns";

interface useMarkdownGrammerProps {
  editorCRDT: EditorCRDT;
  editorState: EditorStateProps;
  setEditorState: React.Dispatch<
    React.SetStateAction<{
      clock: number;
      linkedList: BlockLinkedList;
      currentBlock: BlockId | null;
    }>
  >;
  pageId: string;
  sendBlockInsertOperation: (operation: RemoteBlockInsertOperation) => void;
  sendBlockDeleteOperation: (operation: RemoteBlockDeleteOperation) => void;
  sendCharDeleteOperation: (operation: RemoteCharDeleteOperation) => void;
  sendCharInsertOperation: (operation: RemoteCharInsertOperation) => void;
  sendBlockUpdateOperation: (operation: RemoteBlockUpdateOperation) => void;
}

export const useMarkdownGrammer = ({
  editorCRDT,
  editorState,
  setEditorState,
  pageId,
  sendBlockInsertOperation,
  sendBlockDeleteOperation,
  sendCharDeleteOperation,
  sendCharInsertOperation,
  sendBlockUpdateOperation,
}: useMarkdownGrammerProps) => {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const createNewBlock = (index: number): RemoteBlockInsertOperation => {
        const operation = editorCRDT.localInsert(index, "");
        // TODO: 블록 타입이 초기화가 안됨???
        operation.node.type = "p";
        return operation;
      };

      const updateEditorState = (newBlockId: BlockId | null = null) => {
        setEditorState((prev) => ({
          clock: editorCRDT.clock,
          linkedList: editorCRDT.LinkedList,
          currentBlock: newBlockId || prev.currentBlock,
        }));
      };

      const currentBlockId = editorState.currentBlock;
      if (!currentBlockId) return;

      const currentBlock = editorCRDT.LinkedList.getNode(currentBlockId);
      if (!currentBlock) return;

      const currentIndex = editorCRDT.LinkedList.spread().findIndex((block) =>
        block.id.equals(currentBlockId),
      );

      switch (e.key) {
        case "Enter": {
          e.preventDefault();
          const caretPosition = currentBlock.crdt.currentCaret;
          const currentContent = currentBlock.crdt.read();
          const afterText = currentContent.slice(caretPosition);

          if (!currentContent && currentBlock.type !== "p") {
            currentBlock.type = "p";
            // TODO: Update요청
            // remote update 보내기
            sendBlockUpdateOperation({ node: currentBlock, pageId });
            updateEditorState();
            break;
          }

          if (!currentContent && currentBlock.type === "p") {
            // 새로운 기본 블록 생성
            const operation = createNewBlock(currentIndex + 1);
            operation.node.indent = currentBlock.indent;
            operation.node.crdt = new BlockCRDT(editorCRDT.client);

            sendBlockInsertOperation(operation);

            updateEditorState(operation.node.id);
            break;
          }

          // 현재 캐럿 위치 이후의 텍스트가 있으면 현재 블록 내용 업데이트
          if (afterText) {
            // 캐럿 이후의 텍스트만 제거
            for (let i = currentContent.length - 1; i >= caretPosition; i--) {
              // char remote delete 보내기
              // currentBlock.crdt.localDelete(i, currentBlock.id);
              sendCharDeleteOperation(currentBlock.crdt.localDelete(i, currentBlock.id));
            }
          }

          // 새 블록 생성
          const operation = createNewBlock(currentIndex + 1);
          operation.node.crdt = new BlockCRDT(editorCRDT.client);
          operation.node.indent = currentBlock.indent;
          sendBlockInsertOperation(operation);
          // 캐럿 이후의 텍스트 있으면 새 블록에 추가
          if (afterText) {
            afterText.split("").forEach((char, i) => {
              // char remote insert 보내기
              // newBlock.crdt.localInsert(i, char, newBlock.id);
              sendCharInsertOperation(operation.node.crdt.localInsert(i, char, operation.node.id));
            });
          }

          // 현재 블록이 li나 checkbox면 동일한 타입으로 생성
          if (["ul", "ol", "checkbox"].includes(currentBlock.type)) {
            operation.node.type = currentBlock.type;
            // TODO: Update요청
            // remote update 보내기
            sendBlockUpdateOperation({ node: operation.node, pageId });
          }
          // !! TODO socket.update
          updateEditorState(operation.node.id);
          break;
        }

        case "Backspace": {
          const currentContent = currentBlock.crdt.read();
          if (currentContent === "") {
            e.preventDefault();
            if (currentBlock.indent > 0) {
              currentBlock.indent -= 1;
              // TODO: Update요청
              // remote update 보내기
              sendBlockUpdateOperation({ node: currentBlock, pageId });
              updateEditorState();
              break;
            }

            if (currentBlock.type !== "p") {
              // 마지막 블록이면 기본 블록으로 변경
              currentBlock.type = "p";
              // TODO: Update요청
              // remote update 보내기
              sendBlockUpdateOperation({ node: currentBlock, pageId });
              updateEditorState();
              break;
            }

            const prevBlock =
              currentIndex > 0 ? editorCRDT.LinkedList.findByIndex(currentIndex - 1) : null;
            if (prevBlock) {
              // remote delete 보내기
              // editorCRDT.localDelete(currentIndex, undefined, pageId);
              sendBlockDeleteOperation(editorCRDT.localDelete(currentIndex, undefined, pageId));
              prevBlock.crdt.currentCaret = prevBlock.crdt.read().length;
              editorCRDT.currentBlock = prevBlock;
              updateEditorState(prevBlock.id);
            }
            break;
          } else {
            const { currentCaret } = currentBlock.crdt;
            if (currentCaret === 0) {
              if (currentBlock.indent > 0) {
                currentBlock.indent -= 1;
                // TODO: Update요청
                // remote update 보내기
                sendBlockUpdateOperation({ node: currentBlock, pageId });
                updateEditorState();
                break;
              }
              if (currentBlock.type !== "p") {
                currentBlock.type = "p";
                // TODO: Update요청
                // remote update 보내기
                sendBlockUpdateOperation({ node: currentBlock, pageId });
                updateEditorState();
                // FIX: 서윤님 피드백 반영
              } else {
                const prevBlock =
                  currentIndex > 0 ? editorCRDT.LinkedList.findByIndex(currentIndex - 1) : null;
                if (prevBlock) {
                  const prevBlockEndCaret = prevBlock.crdt.read().length;
                  currentContent.split("").forEach((char) => {
                    // char remote insert 보내기
                    // prevBlock.crdt.localInsert(prevBlock.crdt.read().length, char, prevBlock.id);
                    sendCharInsertOperation(
                      prevBlock.crdt.localInsert(prevBlock.crdt.read().length, char, prevBlock.id),
                    );
                    sendCharDeleteOperation(
                      currentBlock.crdt.localDelete(currentCaret, currentBlock.id),
                    );
                  });
                  prevBlock.crdt.currentCaret = prevBlockEndCaret;
                  // remote delete 보내기
                  // editorCRDT.localDelete(currentIndex, undefined, pageId);
                  sendBlockDeleteOperation(editorCRDT.localDelete(currentIndex, undefined, pageId));
                  updateEditorState(prevBlock.id);
                  e.preventDefault();
                }
              }
            }
            break;
          }
        }

        case "Tab": {
          e.preventDefault();

          if (currentBlock) {
            if (e.shiftKey) {
              // shift + tab: 들여쓰기 감소
              if (currentBlock.indent > 0) {
                currentBlock.indent -= 1;
                // TODO: Update요청
                // remote update 보내기
                sendBlockUpdateOperation({ node: currentBlock, pageId });
                updateEditorState(currentBlock.id);
              }
            } else {
              // tab: 들여쓰기 증가
              console.log("tab");
              const maxIndent = 3;
              if (currentBlock.indent < maxIndent) {
                currentBlock.indent += 1;
                // TODO: Update요청
                // remote update 보내기
                sendBlockUpdateOperation({ node: currentBlock, pageId });
                updateEditorState(currentBlock.id);
              }
            }
          }
          break;
        }

        case " ": {
          const currentContent = currentBlock.crdt.read();
          const markdownElement = checkMarkdownPattern(currentContent);
          if (markdownElement && currentBlock.type === "p") {
            e.preventDefault();
            // 마크다운 패턴 매칭 시 타입 변경하고 내용 비우기
            currentBlock.type = markdownElement.type;
            let deleteCount = 0;
            while (deleteCount < markdownElement.length) {
              // char remote delete 보내기
              // currentBlock.crdt.localDelete(0, currentBlock.id);
              sendCharDeleteOperation(currentBlock.crdt.localDelete(0, currentBlock.id));
              deleteCount += 1;
            }
            // TODO: Update요청
            // remote update 보내기
            sendBlockUpdateOperation({ node: currentBlock, pageId });
            // !!TODO emit 송신
            currentBlock.crdt.currentCaret = 0;
            updateEditorState(currentBlock.id);
          }

          break;
        }

        case "ArrowUp":
        case "ArrowDown": {
          e.preventDefault();
          const blocks = editorCRDT.LinkedList.spread();
          // 이전/다음 블록 존재 여부 확인
          const hasPrevBlock = currentIndex > 0;
          const hasNextBlock = currentIndex < blocks.length - 1;
          // 방향키에 따라 이동 가능 여부 확인
          if (e.key === "ArrowUp" && !hasPrevBlock) return;
          if (e.key === "ArrowDown" && !hasNextBlock) return;

          const targetIndex = e.key === "ArrowUp" ? currentIndex - 1 : currentIndex + 1;

          const targetBlock = blocks[targetIndex];
          targetBlock.crdt.currentCaret = Math.min(
            currentBlock.crdt.currentCaret,
            targetBlock.crdt.read().length,
          );
          updateEditorState(targetBlock.id);
          break;
        }
        // TODO: ArrowLeft, ArrowRight 블록 이동시 캐럿 이상하게 움직이는 것 수정
        case "ArrowLeft":
        case "ArrowRight": {
          const { currentCaret } = currentBlock.crdt;
          const textLength = currentBlock.crdt.read().length;
          if (e.key === "ArrowLeft" && currentCaret > 0) {
            // currentBlock.crdt.currentCaret = currentCaret - 1;
            currentBlock.crdt.currentCaret -= 1;
            break;
          }
          if (e.key === "ArrowRight" && currentCaret < textLength) {
            // currentBlock.crdt.currentCaret = currentCaret + 1;
            currentBlock.crdt.currentCaret += 1;
            break;
          }
          if (e.key === "ArrowLeft" && currentCaret === 0 && currentIndex > 0) {
            const prevBlock = editorCRDT.LinkedList.findByIndex(currentIndex - 1);
            if (prevBlock) {
              prevBlock.crdt.currentCaret = prevBlock.crdt.read().length;
              updateEditorState(prevBlock.id);
            }
            break;
          }
          if (e.key === "ArrowRight" && currentCaret === textLength) {
            // TODO: 다음 블록 없을 때 처리 crdt에 추가
            const nextBlock = editorCRDT.LinkedList.findByIndex(currentIndex + 1);
            if (nextBlock) {
              nextBlock.crdt.currentCaret = 0;
              updateEditorState(nextBlock.id);
            }
            break;
          }
        }
      }
    },
    [editorCRDT, editorState, setEditorState, pageId],
  );

  return { handleKeyDown };
};
