import { Page } from "./Page";

export class WorkSpace {
  id: string;
  pageList: Page[];
  authUser: object;

  constructor(id: string, pageList: Page[]) {
    this.id = id;
    this.pageList = pageList;
    this.authUser = new Map();
    // 직렬화, 역직렬화 메서드 추가
  }
}
