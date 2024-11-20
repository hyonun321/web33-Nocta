import { EditorCRDT, BlockCRDT } from "@noctaCrdt/Crdt";
import { Block } from "@noctaCrdt/Node";
import { BlockId } from "@noctaCrdt/NodeId";
import { useCallback } from "react";
import { checkMarkdownPattern } from "@src/features/editor/utils/markdownPatterns";

interface EditorState {
  editor: EditorCRDT;
}

interface UseMarkdownGrammerProps {
  editorState: EditorState;
  setEditorState: React.Dispatch<React.SetStateAction<EditorState>>;
  pageId: string; // pageId 추가
}

export const useMarkdownGrammer = ({
  editorState,
  setEditorState,
  pageId,
}: UseMarkdownGrammerProps) => {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const createNewBlock = (index: number): Block => {
        const { node: newBlock } = editorState.editor.localInsert(index, "");
        // TODO: 블록 타입이 초기화가 안됨???
        (newBlock as Block).type = "p";
        return newBlock as Block;
      };

      const updateEditorState = (newBlockId: BlockId | null = null) => {
        if (newBlockId) {
          editorState.editor.currentBlock = editorState.editor.LinkedList.getNode(newBlockId);
        }
        setEditorState({ editor: editorState.editor });
      };

      const currentBlockId = editorState.editor.currentBlock;
      if (!currentBlockId) return;

      const { currentBlock } = editorState.editor;
      if (!currentBlock) return;

      const currentIndex = editorState.editor.LinkedList.spread().findIndex((block) =>
        block.id.equals(currentBlock.id),
      );

      switch (e.key) {
        case "Enter": {
          e.preventDefault();
          const caretPosition = currentBlock.crdt.currentCaret;
          const currentContent = currentBlock.crdt.read();
          const afterText = currentContent.slice(caretPosition);

          if (!currentContent && currentBlock.type !== "p") {
            currentBlock.type = "p";
            updateEditorState();
            break;
          }

          if (!currentContent && currentBlock.type === "p") {
            // 새로운 기본 블록 생성
            const newBlock = createNewBlock(currentIndex + 1);
            newBlock.indent = currentBlock.indent;
            newBlock.crdt = new BlockCRDT(editorState.editor.client);
            updateEditorState(newBlock.id);
            break;
          }

          // 현재 캐럿 위치 이후의 텍스트가 있으면 현재 블록 내용 업데이트
          if (afterText) {
            // 캐럿 이후의 텍스트만 제거
            for (let i = currentContent.length - 1; i >= caretPosition; i--) {
              currentBlock.crdt.localDelete(i, currentBlock.id);
            }
          }

          // 새 블록 생성
          const newBlock = createNewBlock(currentIndex + 1);
          newBlock.crdt = new BlockCRDT(editorState.editor.client);
          newBlock.indent = currentBlock.indent;
          // 캐럿 이후의 텍스트 있으면 새 블록에 추가
          if (afterText) {
            afterText.split("").forEach((char, i) => {
              newBlock.crdt.localInsert(i, char, newBlock.id);
            });
          }

          // 현재 블록이 li나 checkbox면 동일한 타입으로 생성
          if (["ul", "ol", "checkbox"].includes(currentBlock.type)) {
            newBlock.type = currentBlock.type;
          }
          // !! TODO socket.update
          updateEditorState(newBlock.id);
          break;
        }

        case "Backspace": {
          const currentContent = currentBlock.crdt.read();
          if (currentContent === "") {
            e.preventDefault();
            if (currentBlock.indent > 0) {
              currentBlock.indent -= 1;
              updateEditorState();
              break;
            }

            if (currentBlock.type !== "p") {
              // 마지막 블록이면 기본 블록으로 변경
              currentBlock.type = "p";
              updateEditorState();
              break;
            }

            const prevBlock =
              currentIndex > 0 ? editorState.editor.LinkedList.findByIndex(currentIndex - 1) : null;
            if (prevBlock) {
              editorState.editor.localDelete(currentIndex, undefined, pageId);
              prevBlock.crdt.currentCaret = prevBlock.crdt.read().length;
              editorState.editor.currentBlock = prevBlock;
              updateEditorState(prevBlock.id);
            }
            break;
          } else {
            const { currentCaret } = currentBlock.crdt;
            if (currentCaret === 0) {
              if (currentBlock.indent > 0) {
                currentBlock.indent -= 1;
                updateEditorState();
                break;
              }
              if (currentBlock.type !== "p") {
                currentBlock.type = "p";
                updateEditorState();
                // FIX: 서윤님 피드백 반영
              } else {
                const prevBlock =
                  currentIndex > 0
                    ? editorState.editor.LinkedList.findByIndex(currentIndex - 1)
                    : null;
                if (prevBlock) {
                  const prevBlockEndCaret = prevBlock.crdt.read().length;
                  currentContent.split("").forEach((char) => {
                    prevBlock.crdt.localInsert(prevBlock.crdt.read().length, char, prevBlock.id);
                  });
                  prevBlock.crdt.currentCaret = prevBlockEndCaret;
                  editorState.editor.localDelete(currentIndex, undefined, pageId);
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
                updateEditorState(currentBlock.id);
              }
            } else {
              // tab: 들여쓰기 증가
              console.log("tab");
              const maxIndent = 3;
              if (currentBlock.indent < maxIndent) {
                currentBlock.indent += 1;
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
              currentBlock.crdt.localDelete(0, currentBlock.id);
              deleteCount += 1;
            }
            // !!TODO emit 송신
            currentBlock.crdt.currentCaret = 0;
            updateEditorState(currentBlock.id);
          }

          break;
        }

        case "ArrowUp":
        case "ArrowDown": {
          e.preventDefault();
          const blocks = editorState.editor.LinkedList.spread();
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
            currentBlock.crdt.currentCaret = currentCaret - 1;
            updateEditorState();
            break;
          }
          if (e.key === "ArrowRight" && currentCaret < textLength) {
            currentBlock.crdt.currentCaret = currentCaret + 1;
            updateEditorState();
            break;
          }
          if (e.key === "ArrowLeft" && currentCaret === 0 && currentIndex > 0) {
            const prevBlock = editorState.editor.LinkedList.findByIndex(currentIndex - 1);
            if (prevBlock) {
              prevBlock.crdt.currentCaret = prevBlock.crdt.read().length;
              updateEditorState(prevBlock.id);
            }
            break;
          }
          if (e.key === "ArrowRight" && currentCaret === textLength) {
            // TODO: 다음 블록 없을 때 처리 crdt에 추가
            const nextBlock = editorState.editor.LinkedList.findByIndex(currentIndex + 1);
            if (nextBlock) {
              nextBlock.crdt.currentCaret = 0;
              updateEditorState(nextBlock.id);
            }
            break;
          }
        }
      }
    },
    [editorState, setEditorState, pageId],
  );

  return { handleKeyDown };
};
