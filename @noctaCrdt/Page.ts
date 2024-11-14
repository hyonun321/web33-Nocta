import { Page as PageInterface } from "@noctaCrdt/Interfaces";
import { CRDT } from "./Crdt";

export class Page implements PageInterface {
  id: string;
  title: string;
  icon: string;
  crdt: CRDT;

  constructor(editorCRDT: CRDT = new CRDT(0)) {
    // 추후 수정
    this.id = "id";
    this.title = "title";
    this.icon = "icon";
    this.crdt = editorCRDT;
    // 직렬화, 역직렬화 메서드 추가
  }
}
