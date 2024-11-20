import { LinkedList } from "./LinkedList";
import { CharId, BlockId, NodeId } from "./NodeId";
import { Node, Char, Block } from "./Node";
import {
  RemoteBlockDeleteOperation,
  RemoteCharDeleteOperation,
  RemoteBlockInsertOperation,
  RemoteCharInsertOperation,
  SerializedProps,
  RemoteReorderOperation,
} from "./Interfaces";

export class CRDT<T extends Node<NodeId>> {
  clock: number;
  client: number;
  LinkedList: LinkedList<T>;

  constructor(client: number) {
    this.clock = 0;
    this.client = client;
    this.LinkedList = new LinkedList<T>();
  }

  localInsert(index: number, value: string, blockId?: BlockId) {}

  localDelete(index: number, blockId?: BlockId, pageId?: string) {}

  remoteInsert(operation: RemoteBlockInsertOperation | RemoteCharInsertOperation) {}

  remoteDelete(operation: RemoteBlockDeleteOperation | RemoteCharDeleteOperation) {}

  read(): string {
    return this.LinkedList.stringify();
  }

  spread(): T[] {
    return this.LinkedList.spread();
  }

  serialize(): SerializedProps<T> {
    return {
      clock: this.clock,
      client: this.client,
      LinkedList: {
        head: this.LinkedList.head,
        nodeMap: this.LinkedList.nodeMap || {},
      },
    };
  }

  deserialize(data: any): void {
    this.clock = data.clock;
    this.client = data.client;
    this.LinkedList = this.deserializeLinkedList(data.LinkedList);
  }

  protected deserializeLinkedList(listData: any): LinkedList<T> {
    const list = new LinkedList<T>();

    if (listData.head) {
      list.head = this.deserializeNodeId(listData.head);
    }

    list.nodeMap = {};
    if (listData.nodeMap && typeof listData.nodeMap === "object") {
      for (const [key, nodeData] of Object.entries(listData.nodeMap)) {
        list.nodeMap[key] = this.deserializeNode(nodeData);
      }
    }

    return list;
  }

  protected deserializeNodeId(idData: any): NodeId {
    return new NodeId(idData.clock, idData.client);
  }

  protected deserializeNode(nodeData: any): T {
    throw new Error("deserializeNode must be implemented in derived class");
  }
}

export class EditorCRDT extends CRDT<Block> {
  currentBlock: Block | null;

  constructor(client: number) {
    super(client);
    this.currentBlock = null;
  }

  localInsert(index: number, value: string): RemoteBlockInsertOperation {
    const id = new BlockId(this.clock + 1, this.client);
    const remoteInsertion = this.LinkedList.insertAtIndex(index, value, id);
    this.clock += 1;
    return { node: remoteInsertion.node } as RemoteBlockInsertOperation;
  }

  localDelete(index: number, blockId: undefined, pageId: string): RemoteBlockDeleteOperation {
    if (index < 0 || index >= this.LinkedList.spread().length) {
      throw new Error(`Invalid index: ${index}`);
    }

    const nodeToDelete = this.LinkedList.findByIndex(index);
    if (!nodeToDelete) {
      throw new Error(`Node not found at index: ${index}`);
    }

    const operation: RemoteBlockDeleteOperation = {
      targetId: nodeToDelete.id,
      clock: this.clock + 1,
      pageId,
    };

    this.LinkedList.deleteNode(nodeToDelete.id);
    this.clock += 1;

    return operation;
  }

  remoteUpdate(block: Block) {
    this.LinkedList.nodeMap[JSON.stringify(block.id)] = block;
    return { remoteUpdateOperation: block };
  }

  remoteInsert(operation: RemoteBlockInsertOperation): void {
    const newNodeId = new BlockId(operation.node.id.clock, operation.node.id.client);
    const newNode = new Block(operation.node.value, newNodeId);

    newNode.next = operation.node.next;
    newNode.prev = operation.node.prev;

    this.LinkedList.insertById(newNode);

    if (this.clock <= newNode.id.clock) {
      this.clock = newNode.id.clock + 1;
    }
  }

  remoteDelete(operation: RemoteBlockDeleteOperation): void {
    const { targetId, clock } = operation;
    if (targetId) {
      this.LinkedList.deleteNode(targetId);
    }
    if (this.clock <= clock) {
      this.clock = clock + 1;
    }
  }

  localReorder(params: {
    targetId: BlockId;
    beforeId: BlockId | null;
    afterId: BlockId | null;
  }): RemoteReorderOperation {
    const operation: RemoteReorderOperation = {
      ...params,
      clock: this.clock + 1,
      client: this.client,
    };

    this.LinkedList.reorderNodes(params);
    this.clock += 1;

    return operation;
  }

  remoteReorder(operation: RemoteReorderOperation): void {
    const { targetId, beforeId, afterId, clock } = operation;

    this.LinkedList.reorderNodes({
      targetId,
      beforeId,
      afterId,
    });

    if (this.clock <= clock) {
      this.clock = clock + 1;
    }
  }

  override deserialize(editorData: any): void {
    super.deserialize(editorData);

    if (editorData.currentBlock) {
      this.currentBlock = this.deserializeNode(editorData.currentBlock);
    }
  }

  protected override deserializeNodeId(idData: any): BlockId {
    return new BlockId(idData.clock, idData.client);
  }

  protected override deserializeNode(blockData: any): Block {
    const blockId = new BlockId(blockData.id.clock, blockData.id.client);
    const block = new Block("", blockId);

    // BlockCRDT 복원
    const blockCRDT = new BlockCRDT(blockData.crdt.client);
    blockCRDT.deserialize(blockData.crdt);
    block.crdt = blockCRDT;

    // 연결 정보 복원
    if (blockData.next) {
      block.next = this.deserializeNodeId(blockData.next);
    }
    if (blockData.prev) {
      block.prev = this.deserializeNodeId(blockData.prev);
    }

    // 추가 속성 복원
    block.animation = blockData.animation || "none";
    block.style = Array.isArray(blockData.style) ? blockData.style : [];
    block.icon = blockData.icon || "";
    block.type = blockData.type || "p";
    block.indent = blockData.indent || 0;

    return block;
  }
}

export class BlockCRDT extends CRDT<Char> {
  currentCaret: number;

  constructor(client: number) {
    super(client);
    this.currentCaret = 0;
  }

  localInsert(index: number, value: string, blockId: BlockId): RemoteCharInsertOperation {
    const id = new CharId(this.clock + 1, this.client);
    const { node } = this.LinkedList.insertAtIndex(index, value, id);
    this.clock += 1;
    const operation: RemoteCharInsertOperation = {
      node,
      blockId,
    };

    return operation;
  }

  localDelete(index: number, blockId: BlockId): RemoteCharDeleteOperation {
    if (index < 0 || index >= this.LinkedList.spread().length) {
      throw new Error(`Invalid index: ${index}`);
    }

    const nodeToDelete = this.LinkedList.findByIndex(index);
    if (!nodeToDelete) {
      throw new Error(`Node not found at index: ${index}`);
    }

    const operation: RemoteCharDeleteOperation = {
      targetId: nodeToDelete.id,
      clock: this.clock + 1,
      blockId,
    };

    this.LinkedList.deleteNode(nodeToDelete.id);
    this.clock += 1;

    return operation;
  }

  remoteInsert(operation: RemoteCharInsertOperation): void {
    const newNodeId = new CharId(operation.node.id.clock, operation.node.id.client);
    const newNode = new Char(operation.node.value, newNodeId);

    newNode.next = operation.node.next;
    newNode.prev = operation.node.prev;

    this.LinkedList.insertById(newNode);

    if (this.clock <= newNode.id.clock) {
      this.clock = newNode.id.clock + 1;
    }
  }

  remoteDelete(operation: RemoteCharDeleteOperation): void {
    const { targetId, clock } = operation;
    if (targetId) {
      const targetNodeId = new CharId(operation.targetId.clock, operation.targetId.client);
      this.LinkedList.deleteNode(targetNodeId);
    }
    if (this.clock <= clock) {
      this.clock = clock + 1;
    }
  }

  override deserialize(crdtData: any): void {
    super.deserialize(crdtData);
    this.currentCaret = crdtData.currentCaret;
  }

  protected override deserializeNodeId(idData: any): CharId {
    return new CharId(idData.clock, idData.client);
  }

  protected override deserializeNode(charData: any): Char {
    const charId = new CharId(charData.id.clock, charData.id.client);
    const char = new Char(charData.value, charId);

    if (charData.next) {
      char.next = this.deserializeNodeId(charData.next);
    }
    if (charData.prev) {
      char.prev = this.deserializeNodeId(charData.prev);
    }

    return char;
  }
}
