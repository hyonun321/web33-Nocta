import { EditorCRDT } from "./Crdt";
import { Block } from "./Node";
import { CRDTSerializedProps } from "./Interfaces";

export interface PageSerializedProps {
  id: string;
  title: string;
  icon: string;
  crdt: CRDTSerializedProps<Block>; // EditorCRDT의 직렬화된 데이터 타입
}

export class Page {
  id: string;
  title: string;
  icon: string;
  crdt: EditorCRDT;

  constructor(
    id: string = crypto.randomUUID(), // 고유한 ID 생성
    title: string = "Untitled",
    icon: string = "📄",
    editorCRDT: EditorCRDT = new EditorCRDT(0),
  ) {
    this.id = id;
    this.title = title;
    this.icon = icon;
    this.crdt = editorCRDT;
  }

  // 페이지 제목 업데이트
  updateTitle(newTitle: string): void {
    this.title = newTitle;
  }

  // 아이콘 업데이트
  updateIcon(newIcon: string): void {
    this.icon = newIcon;
  }

  // 직렬화
  serialize(): PageSerializedProps {
    return {
      id: this.id,
      title: this.title,
      icon: this.icon,
      crdt: this.crdt.serialize(),
    };
  }

  // 역직렬화
  deserialize(data: PageSerializedProps): void {
    if (!data) {
      throw new Error("Invalid data for Page deserialization");
    }

    try {
      this.id = data.id;
      this.title = data.title;
      this.icon = data.icon;

      // CRDT 역직렬화
      this.crdt.deserialize(data.crdt);
    } catch (error) {
      console.error("Error during Page deserialization:", error);
      throw new Error(
        `Failed to deserialize Page: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }
}
