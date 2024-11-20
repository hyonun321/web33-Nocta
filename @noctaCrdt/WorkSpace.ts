import { Page } from "./Page";
import { WorkSpaceSerializedProps } from "./Interfaces";

export class WorkSpace {
  id: string;
  pageList: Page[];
  authUser: Map<string, string>;

  constructor(id: string, pageList: Page[]) {
    this.id = id;
    this.pageList = pageList;
    this.authUser = new Map();
    // 직렬화, 역직렬화 메서드 추가
  }

  serialize(): WorkSpaceSerializedProps {
    return {
      id: this.id,
      pageList: this.pageList,
      authUser: this.authUser,
    };
  }
  deserialize(): void {
    return;
  }
}
