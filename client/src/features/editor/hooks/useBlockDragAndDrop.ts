// hooks/useBlockDragAndDrop.ts
import { DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { EditorCRDT } from "@noctaCrdt/Crdt";
import { BlockLinkedList } from "@noctaCrdt/LinkedList";
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

  return {
    sensors,
    handleDragEnd,
  };
};
