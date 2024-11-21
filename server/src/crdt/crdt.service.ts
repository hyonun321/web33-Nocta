import { Injectable, OnModuleInit } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Workspace, WorkspaceDocument } from "./schemas/workspace.schema";
import { WorkSpace as CRDTWorkSpace } from "@noctaCrdt/WorkSpace";
import { Model } from "mongoose";
import { EditorCRDT, BlockCRDT } from "@noctaCrdt/Crdt";
import { BlockId, CharId } from "@noctaCrdt/NodeId";
import { Block, Char } from "@noctaCrdt/Node";

import { BlockLinkedList, TextLinkedList } from "@noctaCrdt/LinkedList";
import { Page as CRDTPage } from "@noctaCrdt/Page";
import { WorkSpaceSerializedProps } from "@noctaCrdt/Interfaces";

@Injectable()
export class workSpaceService implements OnModuleInit {
  private workspace: CRDTWorkSpace;
  private tempPage: CRDTPage;
  constructor(@InjectModel(Workspace.name) private workspaceModel: Model<WorkspaceDocument>) {
    this.tempPage = new CRDTPage();
    this.workspace = new CRDTWorkSpace("test", [this.tempPage]);
  }

  async onModuleInit() {
    try {
      // MongoDB에서 Workspace 문서 가져오기
      const doc = await this.getDocument();
      if (doc) {
        // 1. Workspace 기본 정보 복원
        this.workspace = new CRDTWorkSpace(doc.id, []);
        this.workspace.deserialize({
          id: doc.id,
          pageList: doc.pageList,
          authUser: doc.authUser,
        } as WorkSpaceSerializedProps);
      }
      console.log("init 이후 서버 인스턴스 확인", this.workspace);
    } catch (error) {
      console.error("Error during CrdtService initialization:", error);
      throw error;
    }
  }

  async getDocument(): Promise<Workspace | null> {
    let doc = await this.workspaceModel.findOne();
    if (!doc) {
      const serializedWorkspace = this.workspace.serialize();
      console.log("Serialized workspace:", serializedWorkspace);

      // Workspace 스키마에 맞게 데이터 구조화
      doc = new this.workspaceModel({
        id: serializedWorkspace.id || "default-id", // 적절한 ID 생성 필요
        pageList: serializedWorkspace.pageList.map((page) => ({
          id: page.id,
          title: page.title,
          icon: page.icon,
          crdt: {
            clock: page.crdt.clock,
            client: page.crdt.client,
            currentBlock: page.crdt.currentBlock,
            LinkedList: {
              head: page.crdt.LinkedList.head,
              nodeMap: page.crdt.LinkedList.nodeMap,
            },
          },
        })),
        authUser: new Map(), // 필요한 경우 초기 인증 사용자 데이터 설정
        updatedAt: new Date(),
      });

      console.log("New document to save:", doc);
      try {
        await doc.save();
        console.log("Document saved successfully");
      } catch (error) {
        console.error("Error saving document:", error);
        throw error;
      }
    }
    return doc;
  }
  async updateDocument(): Promise<Workspace | null> {
    const serializedWorkspace = this.workspace.serialize();
    return await this.workspaceModel
      .findOneAndUpdate(
        {},
        {
          $set: {
            ...serializedWorkspace,
            updatedAt: new Date(),
          },
        },
        { new: true, upsert: true },
      )
      .exec();
  }

  // 각 레벨별 구체적인 Insert/Delete 처리 메서드들
  async handleWorkSpaceInsert(payload: any): Promise<void> {
    // WorkSpace 레벨 Insert 구현
  }

  async handleWorkSpaceDelete(payload: any): Promise<void> {
    // WorkSpace 레벨 Delete 구현
  }

  async handlePageInsert(payload: any): Promise<void> {
    // Page 레벨 Insert 구현
    // const newPage = await this.getWorkspace().getPage(payload).deserializePage(payload);
    // this.workspace.pageList.push(newPage);
  }

  async handlePageDelete(payload: any): Promise<void> {
    // Page 레벨 Delete 구현
    const pageIndex = this.workspace.pageList.findIndex((p) => p.id === payload.pageId);
    if (pageIndex !== -1) {
      this.workspace.pageList.splice(pageIndex, 1);
    }
  }

  async handleBlockInsert(editorCRDT: EditorCRDT, payload: any): Promise<void> {
    // Block 레벨 Insert 구현
    console.log(editorCRDT, payload, "???");
    editorCRDT.remoteInsert(payload);
  }

  async handleBlockDelete(editorCRDT: EditorCRDT, payload: any): Promise<void> {
    // Block 레벨 Delete 구현
    editorCRDT.remoteDelete(payload);
  }

  async handleCharInsert(blockCRDT: BlockCRDT, payload: any): Promise<void> {
    // Char 레벨 Insert 구현
    blockCRDT.remoteInsert(payload);
  }

  async handleCharDelete(blockCRDT: BlockCRDT, payload: any): Promise<void> {
    // Char 레벨 Delete 구현
    blockCRDT.remoteDelete(payload);
  }

  getWorkspace(): CRDTWorkSpace {
    return this.workspace;
  }
}

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
