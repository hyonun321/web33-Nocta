import { EditorCRDT } from "./Crdt";

interface PageProps {
  id: string;
  title: string;
  icon: string;
  crdt: EditorCRDT;
}

export class Page {
  id: string;
  title: string;
  icon: string;
  crdt: EditorCRDT;

  constructor(editorCRDT: EditorCRDT = new EditorCRDT(0)) {
    // 추후 수정 직렬화, 역직렬화 메서드 추가
    this.id = "id";
    this.title = "title";
    this.icon = "icon";
    this.crdt = editorCRDT;
  }

  serialize(): PageProps {
    return {
      id: this.id,
      title: this.title,
      icon: this.icon,
      crdt: this.crdt,
    };
  }
  fromJSON(): void {
    return;
  }
}
