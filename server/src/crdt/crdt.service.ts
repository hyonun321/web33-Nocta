import { Injectable, OnModuleInit } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Workspace, WorkspaceDocument } from "./schemas/workspace.schema";
import { WorkSpace as CRDTWorkSpace } from "@noctaCrdt/WorkSpace";
import { Model } from "mongoose";
import { EditorCRDT, BlockCRDT } from "@noctaCrdt/Crdt";
import { Page as CRDTPage } from "@noctaCrdt/Page";
import { WorkSpaceSerializedProps } from "@noctaCrdt/Interfaces";

@Injectable()
export class workSpaceService implements OnModuleInit {
  private workspaces: Map<string, CRDTWorkSpace>;
  constructor(@InjectModel(Workspace.name) private workspaceModel: Model<WorkspaceDocument>) {}
  async onModuleInit() {
    this.workspaces = new Map();
    // 게스트 워크스페이스 초기화
    const guestWorkspace = new CRDTWorkSpace("guest", []);
    this.workspaces.set("guest", guestWorkspace);
  }
  getWorkspace(userId: string): CRDTWorkSpace {
    if (!this.workspaces.has(userId)) {
      // 새로운 워크스페이스 생성
      const newWorkspace = new CRDTWorkSpace(userId, []);
      this.workspaces.set(userId, newWorkspace);
    }
    return this.workspaces.get(userId);
  }
}

// // 1. 연산마다 mongoDB값을 조작할 것인지,
// assync hand createPage MongoDB(operation){
//   분석을해서
//   const 어쩌구 = await doc.findOne
//   mongoDb 의 어떤
//   page[pageId] = 생성 ;
//   }
// 어떤 pageId에 3번째 블럭에 2번째 인덱스 char를 삭제한다.
// operation을 분리해서
// mongoDB를 그부분만 조작하도록 한다.

// pageId[id] =
// workspaceId[id] =
// editor[id]

// // 2. 연산마다 상태로 update를 할 것 인지.  create/page ->
// 서버의 인스턴스 상태를 통째로 mongoDB에다가
// 덮어씌워버림. -> 인스턴스 상태가 얼마나 많은데..
// 직렬화도 문제임.
// 스키마도 복잡할 것으로 예상됨.

// async onModuleInit() {
//   try {
//     // MongoDB에서 Workspace 문서 가져오기
//     const doc = await this.getDocument();
//     if (doc) {
//       // 1. Workspace 기본 정보 복원
//       this.workspace = new CRDTWorkSpace(doc.id, []);
//       this.workspace.deserialize({
//         id: doc.id,
//         pageList: doc.pageList,
//         authUser: doc.authUser,
//       } as WorkSpaceSerializedProps);
//     }
//     console.log("init 이후 서버 인스턴스 확인", this.workspace);
//   } catch (error) {
//     console.error("Error during CrdtService initialization:", error);
//     throw error;
//   }
// }
// async getDocument(): Promise<Workspace | null> {
//   let doc = await this.workspaceModel.findOne();
//   if (!doc) {
//     const serializedWorkspace = this.workspace.serialize();
//     console.log("Serialized workspace:", serializedWorkspace);

//     // Workspace 스키마에 맞게 데이터 구조화
//     doc = new this.workspaceModel({
//       id: serializedWorkspace.id || "default-id", // 적절한 ID 생성 필요
//       pageList: serializedWorkspace.pageList.map((page) => ({
//         id: page.id,
//         title: page.title,
//         icon: page.icon,
//         crdt: {
//           clock: page.crdt.clock,
//           client: page.crdt.client,
//           currentBlock: page.crdt.currentBlock,
//           LinkedList: {
//             head: page.crdt.LinkedList.head,
//             nodeMap: page.crdt.LinkedList.nodeMap,
//           },
//         },
//       })),
//       authUser: new Map(), // 필요한 경우 초기 인증 사용자 데이터 설정
//       updatedAt: new Date(),
//     });

//     console.log("New document to save:", doc);
//     try {
//       await doc.save();
//       console.log("Document saved successfully");
//     } catch (error) {
//       console.error("Error saving document:", error);
//       throw error;
//     }
//   }
//   return doc;
// }
// async updateDocument(): Promise<Workspace | null> {
//   const serializedWorkspace = this.workspace.serialize();
//   return await this.workspaceModel
//     .findOneAndUpdate(
//       {},
//       {
//         $set: {
//           ...serializedWorkspace,
//           updatedAt: new Date(),
//         },
//       },
//       { new: true, upsert: true },
//     )
//     .exec();
// }

// // 각 레벨별 구체적인 Insert/Delete 처리 메서드들
// async handleWorkSpaceInsert(payload: any): Promise<void> {
//   // WorkSpace 레벨 Insert 구현
// }

// async handleWorkSpaceDelete(payload: any): Promise<void> {
//   // WorkSpace 레벨 Delete 구현
// }

// async handlePageInsert(payload: any): Promise<void> {
//   // Page 레벨 Insert 구현
//   // const newPage = await this.getWorkspace().getPage(payload).deserializePage(payload);
//   // this.workspace.pageList.push(newPage);
// }

// async handlePageDelete(payload: any): Promise<void> {
//   // Page 레벨 Delete 구현
//   const pageIndex = this.workspace.pageList.findIndex((p) => p.id === payload.pageId);
//   if (pageIndex !== -1) {
//     this.workspace.pageList.splice(pageIndex, 1);
//   }
// }

// async handleBlockInsert(editorCRDT: EditorCRDT, payload: any): Promise<void> {
//   // Block 레벨 Insert 구현
//   console.log(editorCRDT, payload, "???");
//   editorCRDT.remoteInsert(payload);
// }

// async handleBlockDelete(editorCRDT: EditorCRDT, payload: any): Promise<void> {
//   // Block 레벨 Delete 구현
//   editorCRDT.remoteDelete(payload);
// }

// async handleCharInsert(blockCRDT: BlockCRDT, payload: any): Promise<void> {
//   // Char 레벨 Insert 구현
//   blockCRDT.remoteInsert(payload);
// }

// async handleCharDelete(blockCRDT: BlockCRDT, payload: any): Promise<void> {
//   // Char 레벨 Delete 구현
//   blockCRDT.remoteDelete(payload);
// }

// getWorkspace(): CRDTWorkSpace {
//   return this.workspace;
// }

// this.crdt = new EditorCRDT(0);
// try {
//   // 저장된 CRDT 상태를 복원
//   this.crdt.clock = doc.crdt.clock;
//   this.crdt.client = doc.crdt.client;

//   // LinkedList 복원
//   if (doc.crdt.LinkedList.head) {
//     this.crdt.LinkedList.head = new CharId(
//       doc.crdt.LinkedList.head.clock,
//       doc.crdt.LinkedList.head.client,
//     );
//   }

//   this.crdt.LinkedList.nodeMap = {};
//   for (const [key, node] of Object.entries(doc.crdt.LinkedList.nodeMap)) {
//     const reconstructedNode = new Char(
//       node.value,
//       new CharId(node.id.clock, node.id.client),
//     );

//     if (node.next) {
//       reconstructedNode.next = new CharId(node.next.clock, node.next.client);
//     }
//     if (node.prev) {
//       reconstructedNode.prev = new CharId(node.prev.clock, node.prev.client);
//     }

//     this.crdt.LinkedList.nodeMap[??].crdt.LinkedList.nodeMap[key] = reconstructedNode;
//   }
// } catch (e) {
//   console.error("Error reconstructing CRDT:", e);
// }
