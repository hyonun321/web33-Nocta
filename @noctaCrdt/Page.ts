import { EditorCRDT } from "./Crdt";

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
}
