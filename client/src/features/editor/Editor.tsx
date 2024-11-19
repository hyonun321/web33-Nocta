import { DndContext } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { BlockCRDT, EditorCRDT } from "@noctaCrdt/Crdt";
import { BlockLinkedList, TextLinkedList, LinkedList } from "@noctaCrdt/LinkedList";
import { Block as CRDTBlock } from "@noctaCrdt/Node";
import { BlockId, CharId } from "@noctaCrdt/NodeId";
import { RemoteCharInsertOperation } from "node_modules/@noctaCrdt/Interfaces.ts";
import { useRef, useState, useCallback, useEffect } from "react";
import { useSocket } from "@src/apis/useSocket.ts";
import { editorContainer, editorTitleContainer, editorTitle } from "./Editor.style";
import { Block } from "./components/block/Block.tsx";
import { useBlockDragAndDrop } from "./hooks/useBlockDragAndDrop";
import { useMarkdownGrammer } from "./hooks/useMarkdownGrammer";

interface EditorProps {
  onTitleChange: (title: string) => void;
  pageId: string;
  editorCRDT: EditorCRDT;
}

export interface EditorStateProps {
  clock: number;
  linkedList: BlockLinkedList;
  currentBlock: BlockId | null;
}

const deserializeEditorCRDT = (editorData: any): EditorCRDT => {
  const editor = new EditorCRDT(editorData.client);
  editor.clock = editorData.clock;

  if (editorData.currentBlock) {
    editor.currentBlock = deserializeBlock(editorData.currentBlock);
  }

  editor.LinkedList = deserializeBlockLinkedList(editorData.LinkedList);

  return editor;
};

const deserializeBlockLinkedList = (listData: any): BlockLinkedList => {
  const blockList = new BlockLinkedList();

  // head 복원
  if (listData.head) {
    blockList.head = new BlockId(listData.head.clock, listData.head.client);
  }

  // nodeMap 복원
  blockList.nodeMap = {};

  if (listData.nodeMap && typeof listData.nodeMap === "object") {
    for (const [key, blockData] of Object.entries(listData.nodeMap)) {
      blockList.nodeMap[key] = deserializeBlock(blockData);
    }
  } else {
    console.warn("listData.nodeMap이 없습니다. 빈 nodeMap으로 초기화합니다.");
  }

  return blockList;
};

const deserializeBlock = (blockData: any): CRDTBlock => {
  // BlockId 생성
  const blockId = new BlockId(blockData.id.clock, blockData.id.client);

  // Block 인스턴스 생성
  const block = new CRDTBlock("", blockData.id);

  // BlockCRDT 복원
  block.crdt = deserializeBlockCRDT(blockData.crdt);

  // 연결 정보(next, prev) 복원
  if (blockData.next) {
    block.next = new BlockId(blockData.next.clock, blockData.next.client);
  }
  if (blockData.prev) {
    block.prev = new BlockId(blockData.prev.clock, blockData.prev.client);
  }

  // 추가 속성 복원
  block.animation = blockData.animation || "none";
  block.style = Array.isArray(blockData.style) ? blockData.style : [];

  return block;
};

const deserializeBlockCRDT = (crdtData: any): BlockCRDT => {
  const blockCRDT = new BlockCRDT(crdtData.client);

  blockCRDT.clock = crdtData.clock;
  blockCRDT.currentCaret = crdtData.currentCaret;
  blockCRDT.LinkedList = deserializeTextLinkedList(crdtData.LinkedList);

  return blockCRDT;
};

const deserializeTextLinkedList = (listData: any): TextLinkedList => {
  const textList = new TextLinkedList();

  // head 복원
  if (listData.head) {
    textList.head = new CharId(listData.head.clock, listData.head.client);
  }

  // nodeMap 복원
  textList.nodeMap = {};
  for (const [key, charData] of listData.nodeMap.entries()) {
    textList.nodeMap[key] = deserializeChar(charData);
  }

  return textList;
};

// TODO: pageId, editorCRDT를 props로 받아와야함
export const Editor = ({ onTitleChange, pageId, editorCRDT }: EditorProps) => {
  const { sendCharInsertOperation, sendCharDeleteOperation, subscribeToRemoteOperations } =
    useSocket();
  const [editorState, setEditorState] = useState<EditorCRDT>(() => {
    return deserializeEditorCRDT(editorCRDT);
  });

  console.log("처음 editorstate:", editorState, typeof editorCRDT);

  useEffect(() => {
    const newState = deserializeEditorCRDT(editorCRDT);
    newState.LinkedList;
    console.log(newState);
    setEditorState(newState);
    console.log(editorState);
  }, []);

  const { sensors, handleDragEnd } = useBlockDragAndDrop({
    editorCRDT,
    editorState,
    setEditorState,
  });

  const { handleKeyDown } = useMarkdownGrammer({
    editorCRDT,
    editorState,
    setEditorState,
  });

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onTitleChange(e.target.value);
  };

  const handleBlockClick = (blockId: BlockId, e: React.MouseEvent<HTMLDivElement>) => {
    const block = editorState.LinkedList.getNode(blockId);
    if (!block) return;

    // 클릭된 요소 내에서의 위치를 가져오기 위해
    const range = document.caretRangeFromPoint(e.clientX, e.clientY);
    if (!range) return;

    const selection = window.getSelection();
    if (!selection) return;

    // 새로운 Range로 Selection 설정
    selection.removeAllRanges();
    selection.addRange(range);

    // 현재 캐럿 위치를 저장
    block.crdt.currentCaret = selection.focusOffset;

    setEditorState((prev) => ({
      ...prev,
      currentBlock: blockId,
    }));
  };

  const handleBlockInput = useCallback(
    (e: React.FormEvent<HTMLDivElement>, block: CRDTBlock) => {
      if (!block) return;

      let operationNode;
      const element = e.currentTarget;
      const newContent = element.textContent || "";
      const currentContent = block.crdt.read();
      const selection = window.getSelection();
      const caretPosition = selection?.focusOffset || 0;

      if (newContent.length > currentContent.length) {
        let charNode: RemoteCharInsertOperation;
        if (caretPosition === 0) {
          const [addedChar] = newContent;
          charNode = block.crdt.localInsert(0, addedChar, block.id);
          block.crdt.currentCaret = 1;
        } else if (caretPosition > currentContent.length) {
          const addedChar = newContent[newContent.length - 1];
          charNode = block.crdt.localInsert(currentContent.length, addedChar, block.id);
          block.crdt.currentCaret = caretPosition;
        } else {
          const addedChar = newContent[caretPosition - 1];
          charNode = block.crdt.localInsert(caretPosition - 1, addedChar, block.id);
          block.crdt.currentCaret = caretPosition;
        }
        sendCharInsertOperation({ node: charNode.node, blockId: block.id });
      } else if (newContent.length < currentContent.length) {
        // 문자가 삭제된 경우
        operationNode = block.crdt.localDelete(caretPosition, block.id);
        block.crdt.currentCaret = caretPosition;
        console.log("로컬 삭제 연산 송신", operationNode);
        sendCharDeleteOperation(operationNode);
      }

      setEditorState((prev) => ({
        clock: editorCRDT.clock,
        linkedList: editorCRDT.LinkedList,
        currentBlock: prev.currentBlock,
      }));
    },
    [editorState.linkedList, sendCharInsertOperation, sendCharDeleteOperation],
  );

  const subscriptionRef = useRef(false);

  useEffect(() => {
    if (subscriptionRef.current) return;
    subscriptionRef.current = true;

    const unsubscribe = subscribeToRemoteOperations({
      onRemoteBlockInsert: (operation) => {
        console.log(operation, "block : 입력 확인합니다이");
        if (!editorCRDT) return;
        editorCRDT.remoteInsert(operation);
        setEditorState((prev) => ({
          clock: editorCRDT.clock,
          linkedList: editorCRDT.LinkedList,
          currentBlock: prev.currentBlock,
        }));
      },

      onRemoteBlockDelete: (operation) => {
        console.log(operation, "block : 삭제 확인합니다이");
        if (!editorCRDT) return;
        editorCRDT.remoteDelete(operation);
        setEditorState((prev) => ({
          clock: editorCRDT.clock,
          linkedList: editorCRDT.LinkedList,
          currentBlock: prev.currentBlock,
        }));
      },

      onRemoteCharInsert: (operation) => {
        if (!editorCRDT) return;
        const targetBlock = editorCRDT.LinkedList.nodeMap[JSON.stringify(operation.blockId)];
        targetBlock.crdt.remoteInsert(operation);
        setEditorState((prev) => ({
          clock: editorCRDT.clock,
          linkedList: editorCRDT.LinkedList,
          currentBlock: prev.currentBlock,
        }));
      },

      onRemoteCharDelete: (operation) => {
        console.log(operation, "char : 삭제 확인합니다이");
        if (!editorCRDT) return;
        const targetBlock = editorCRDT.LinkedList.nodeMap[JSON.stringify(operation.blockId)];

        targetBlock.crdt.remoteDelete({ targetId: operation.targetId, clock: operation.clock });
        setEditorState((prev) => ({
          clock: editorCRDT.clock,
          linkedList: editorCRDT.LinkedList,
          currentBlock: prev.currentBlock,
        }));
      },

      onRemoteBlockUpdate: (operation) => {
        console.log(operation, "새 블럭 업데이트 수신 ");
      },
      onRemoteCursor: (position) => {
        console.log(position, "커서위치 수신");
      },
    });

    return () => {
      subscriptionRef.current = false;
      unsubscribe?.();
    };
  }, []);

  console.log(editorState.LinkedList instanceof LinkedList);

  console.log("block list", editorState.LinkedList.spread());

  return (
    <div className={editorContainer}>
      <div className={editorTitleContainer}>
        <input
          type="text"
          placeholder="제목을 입력하세요..."
          onChange={handleTitleChange}
          className={editorTitle}
        />
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <SortableContext
            items={editorState.LinkedList.spread().map(
              (block) => `${block.id.client}-${block.id.clock}`,
            )}
            strategy={verticalListSortingStrategy}
          >
            {editorState.LinkedList.spread().map((block) => (
              <Block
                key={`${block.id.client}-${block.id.clock}`}
                id={`${block.id.client}-${block.id.clock}`}
                block={block}
                isActive={block.id === editorState.currentBlock}
                onInput={handleBlockInput}
                onKeyDown={handleKeyDown}
                onClick={handleBlockClick}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
};
