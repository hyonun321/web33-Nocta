import { LinkedList, BlockLinkedList, TextLinkedList } from "./LinkedList";
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

  constructor(client: number, LinkedListClass: new () => LinkedList<T>) {
    this.clock = 0;
    this.client = client;
    this.LinkedList = new LinkedListClass();
  }

  localInsert(index: number, value: string, blockId?: BlockId): any {
    // 기본 CRDT에서는 구현하지 않고, 하위 클래스에서 구현
    throw new Error("Method not implemented.");
  }

  localDelete(index: number, blockId?: BlockId, pageId?: string): any {
    // 기본 CRDT에서는 구현하지 않고, 하위 클래스에서 구현
    throw new Error("Method not implemented.");
  }

  remoteInsert(operation: any): void {
    // 기본 CRDT에서는 구현하지 않고, 하위 클래스에서 구현
    throw new Error("Method not implemented.");
  }

  remoteDelete(operation: any): void {
    // 기본 CRDT에서는 구현하지 않고, 하위 클래스에서 구현
    throw new Error("Method not implemented.");
  }

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
      LinkedList: this.LinkedList.serialize(),
    };
  }

  deserialize(data: any): void {
    this.clock = data.clock;
    this.client = data.client;
    this.LinkedList.deserialize(data.LinkedList);
  }
}

// EditorCRDT 클래스: 블록을 관리
export class EditorCRDT extends CRDT<Block> {
  currentBlock: Block | null;

  constructor(client: number) {
    super(client, BlockLinkedList);
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

  serialize(): SerializedProps<Block> {
    return {
      ...super.serialize(),
      currentBlock: this.currentBlock ? this.currentBlock.serialize() : null,
    };
  }

  deserialize(data: any): void {
    super.deserialize(data);
    this.currentBlock = data.currentBlock ? Block.deserialize(data.currentBlock) : null;
  }
}

// BlockCRDT 클래스: 문자(Char)를 관리
export class BlockCRDT extends CRDT<Char> {
  currentCaret: number;

  constructor(client: number) {
    super(client, TextLinkedList);
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

  serialize(): SerializedProps<Char> {
    return {
      ...super.serialize(),
      currentCaret: this.currentCaret,
    };
  }

  static deserialize(data: any): BlockCRDT {
    const crdt = new BlockCRDT(data.client);
    crdt.clock = data.clock;
    crdt.LinkedList.deserialize(data.LinkedList);
    crdt.currentCaret = data.currentCaret;
    return crdt;
  }

  deserialize(data: any): void {
    super.deserialize(data);
    this.currentCaret = data.currentCaret;
  }
}
