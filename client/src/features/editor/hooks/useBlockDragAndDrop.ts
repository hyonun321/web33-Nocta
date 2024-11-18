// hooks/useBlockDragAndDrop.ts
import { DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { EditorCRDT } from "@noctaCrdt/Crdt";
import { EditorStateProps } from "../Editor";

interface UseBlockDragAndDropProps {
  editorCRDT: EditorCRDT;
  editorState: EditorStateProps;
  setEditorState: React.Dispatch<React.SetStateAction<EditorStateProps>>;
}

export const useBlockDragAndDrop = ({
  editorCRDT,
  editorState,
  setEditorState,
}: UseBlockDragAndDropProps) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    try {
      const nodes = editorState.linkedList.spread();

      // ID 문자열에서 client와 clock 추출
      const parseNodeId = (idString: string): { client: number; clock: number } => {
        const [client, clock] = idString.split("-").map(Number);
        return { client, clock };
      };

      // 파싱된 ID 정보로 실제 노드 찾기
      const targetInfo = parseNodeId(active.id as string);
      const overInfo = parseNodeId(over.id as string);

      // 기존 블록의 ID로 노드 찾기
      const targetNode = nodes.find(
        (block) => block.id.client === targetInfo.client && block.id.clock === targetInfo.clock,
      );
      const overNode = nodes.find(
        (block) => block.id.client === overInfo.client && block.id.clock === overInfo.clock,
      );

      if (!targetNode || !overNode) {
        throw new Error("Unable to find target or destination node");
      }

      // 드롭 위치 기준으로 새로운 위치의 이전/다음 노드 찾기
      const overIndex = nodes.indexOf(overNode);
      const beforeNode = overIndex > 0 ? nodes[overIndex - 1] : null;
      const afterNode = overIndex < nodes.length - 1 ? nodes[overIndex + 1] : null;

      // EditorCRDT의 현재 상태로 작업
      // TODO: 리턴받은 remoteReorder를 socket으로 전송
      editorCRDT.localReorder({
        targetId: targetNode.id,
        beforeId: beforeNode?.id || null,
        afterId: afterNode?.id || null,
      });

      // EditorState 업데이트
      setEditorState({
        clock: editorCRDT.clock,
        linkedList: editorCRDT.LinkedList,
        currentBlock: editorState.currentBlock,
      });
    } catch (error) {
      console.error("Failed to reorder blocks:", error);
    }
  };

  /*
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    try {
      const oldIndex = editorState.linkedList
        .spread()
        .findIndex((block) => `${block.id.client}-${block.id.clock}` === active.id);
      const newIndex = editorState.linkedList
        .spread()
        .findIndex((block) => `${block.id.client}-${block.id.clock}` === over.id);

      // EditorCRDT 업데이트
      editorCRDT.LinkedList = new BlockLinkedList(editorState.linkedList);
      editorCRDT.LinkedList.reorderNodes(oldIndex, newIndex);
      editorCRDT.clock += 1;

      // 상태 업데이트
      setEditorState({
        clock: editorCRDT.clock,
        linkedList: editorCRDT.LinkedList,
        currentBlock: editorState.currentBlock,
      });
    } catch (error) {
      console.error("Failed to reorder blocks:", error);
    }
  };
  */

  return {
    sensors,
    handleDragEnd,
  };
};
