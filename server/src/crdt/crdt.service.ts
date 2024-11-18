import { Injectable, OnModuleInit } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Doc, DocumentDocument } from "./schemas/document.schema";
import { Model } from "mongoose";
import { BlockCRDT } from "@noctaCrdt/Crdt";
import { RemoteInsertOperation, RemoteDeleteOperation } from "@noctaCrdt/Interfaces";
import { CharId } from "@noctaCrdt/NodeId";
import { Char } from "@noctaCrdt/Node";

@Injectable()
export class CrdtService implements OnModuleInit {
  private crdt: BlockCRDT;

  constructor(@InjectModel(Doc.name) private documentModel: Model<DocumentDocument>) {
    this.crdt = new BlockCRDT(0);
  }
  async onModuleInit() {
    try {
      const doc = await this.getDocument();
      if (doc && doc.crdt) {
        this.crdt = new BlockCRDT(0);
        try {
          // 저장된 CRDT 상태를 복원
          this.crdt.clock = doc.crdt.clock;
          this.crdt.client = doc.crdt.client;

          // LinkedList 복원
          if (doc.crdt.LinkedList.head) {
            this.crdt.LinkedList.head = new CharId(
              doc.crdt.LinkedList.head.clock,
              doc.crdt.LinkedList.head.client,
            );
          }

          this.crdt.LinkedList.nodeMap = {};
          for (const [key, node] of Object.entries(doc.crdt.LinkedList.nodeMap)) {
            const reconstructedNode = new Char(
              node.value,
              new CharId(node.id.clock, node.id.client),
            );

            if (node.next) {
              reconstructedNode.next = new CharId(node.next.clock, node.next.client);
            }
            if (node.prev) {
              reconstructedNode.prev = new CharId(node.prev.clock, node.prev.client);
            }

            this.crdt.LinkedList.nodeMap[key] = reconstructedNode;
          }
        } catch (e) {
          console.error("Error reconstructing CRDT:", e);
        }
      }
    } catch (error) {
      console.error("Error during CrdtService initialization:", error);
    }
  }
  async getDocument(): Promise<Doc> {
    let doc = await this.documentModel.findOne();
    if (!doc) {
      doc = new this.documentModel({ content: JSON.stringify(this.crdt.spread()) });
      await doc.save();
    }
    return doc;
  }

  async updateDocument(): Promise<Doc> {
    const serializedCRDT = this.crdt.serialize();
    const doc = await this.documentModel.findOneAndUpdate(
      {},
      { crdt: serializedCRDT, updatedAt: new Date() },
      { new: true, upsert: true },
    );
    if (!doc) throw new Error("문서 저장 실패");
    return doc;
  }

  async handleInsert(operation: RemoteInsertOperation): Promise<void> {
    this.crdt.remoteInsert(operation);
    await this.updateDocument();
  }

  async handleDelete(operation: RemoteDeleteOperation): Promise<void> {
    this.crdt.remoteDelete(operation);
    await this.updateDocument();
  }

  getText(): string {
    return this.crdt.read();
  }

  getCRDT(): BlockCRDT {
    return this.crdt;
  }
}
