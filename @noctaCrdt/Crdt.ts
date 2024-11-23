import { LinkedList, BlockLinkedList, TextLinkedList } from "./LinkedList";
import { CharId, BlockId, NodeId } from "./NodeId";
import { Node, Char, Block } from "./Node";
import {
  RemoteBlockDeleteOperation,
  RemoteCharDeleteOperation,
  RemoteBlockInsertOperation,
  RemoteCharInsertOperation,
  CRDTSerializedProps,
  RemoteBlockReorderOperation,
  RemoteBlockUpdateOperation,
  RemoteCharUpdateOperation,
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

  localInsert(index: number, value: string, blockId?: BlockId, pageId?: string): any {
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

  serialize(): CRDTSerializedProps<T> {
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
      clock: this.clock,
      pageId,
    };

    this.LinkedList.deleteNode(nodeToDelete.id);
    this.clock += 1;

    return operation;
  }

  localUpdate(block: Block, pageId: string): RemoteBlockUpdateOperation {
    const updatedBlock = this.LinkedList.nodeMap[JSON.stringify(block.id)];
    updatedBlock.animation = block.animation;
    updatedBlock.icon = block.icon;
    updatedBlock.indent = block.indent;
    updatedBlock.style = block.style;
    updatedBlock.type = block.type;
    // this.LinkedList.nodeMap[JSON.stringify(block.id)] = block;
    return { node: updatedBlock, pageId };
  }

  remoteUpdate(block: Block, pageId: string): RemoteBlockUpdateOperation {
    const updatedBlock = this.LinkedList.nodeMap[JSON.stringify(block.id)];
    updatedBlock.animation = block.animation;
    updatedBlock.icon = block.icon;
    updatedBlock.indent = block.indent;
    updatedBlock.style = block.style;
    updatedBlock.type = block.type;
    // this.LinkedList.nodeMap[JSON.stringify(block.id)] = block;
    return { node: updatedBlock, pageId };
  }

  remoteInsert(operation: RemoteBlockInsertOperation): void {
    const newNodeId = new BlockId(operation.node.id.clock, operation.node.id.client);
    const newNode = new Block(operation.node.value, newNodeId);

    newNode.next = operation.node.next;
    newNode.prev = operation.node.prev;

    this.LinkedList.insertById(newNode);

    this.clock = Math.max(this.clock, operation.node.id.clock) + 1;
    /*
    if (this.clock <= newNode.id.clock) {
      this.clock = newNode.id.clock + 1;
    }
      */
  }

  remoteDelete(operation: RemoteBlockDeleteOperation): void {
    const { targetId, clock } = operation;
    if (targetId) {
      const targetNodeId = new BlockId(operation.targetId.clock, operation.targetId.client);
      this.LinkedList.deleteNode(targetNodeId);
    }
    this.clock = Math.max(this.clock, clock) + 1;
    /*
    if (this.clock <= clock) {
      this.clock = clock + 1;
    }
      */
  }

  localReorder(params: {
    targetId: BlockId;
    beforeId: BlockId | null;
    afterId: BlockId | null;
    pageId: string;
  }): RemoteBlockReorderOperation {
    const operation: RemoteBlockReorderOperation = {
      ...params,
      clock: this.clock,
      client: this.client,
    };

    this.LinkedList.reorderNodes({
      targetId: params.targetId,
      beforeId: params.beforeId,
      afterId: params.afterId,
    });
    this.clock += 1;

    return operation;
  }

  remoteReorder(operation: RemoteBlockReorderOperation): void {
    const { targetId, beforeId, afterId, clock } = operation;

    this.LinkedList.reorderNodes({
      targetId,
      beforeId,
      afterId,
    });

    this.clock = Math.max(this.clock, clock) + 1;
  }

  serialize(): CRDTSerializedProps<Block> {
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

  localInsert(
    index: number,
    value: string,
    blockId: BlockId,
    pageId: string,
  ): RemoteCharInsertOperation {
    const id = new CharId(this.clock + 1, this.client);
    const { node } = this.LinkedList.insertAtIndex(index, value, id) as { node: Char };
    this.clock += 1;
    const operation: RemoteCharInsertOperation = {
      node,
      blockId,
      pageId,
    };

    return operation;
  }

  localDelete(index: number, blockId: BlockId, pageId: string): RemoteCharDeleteOperation {
    if (index < 0 || index >= this.LinkedList.spread().length) {
      throw new Error(`Invalid index: ${index}`);
    }

    const nodeToDelete = this.LinkedList.findByIndex(index);
    if (!nodeToDelete) {
      throw new Error(`Node not found at index: ${index}`);
    }

    const operation: RemoteCharDeleteOperation = {
      targetId: nodeToDelete.id,
      clock: this.clock,
      blockId,
      pageId,
    };

    this.LinkedList.deleteNode(nodeToDelete.id);
    this.clock += 1;

    return operation;
  }

  localUpdate(node: Char, blockId: BlockId, pageId: string): RemoteCharUpdateOperation {
    const updatedChar = this.LinkedList.nodeMap[JSON.stringify(node.id)];
    updatedChar.style = [...node.style];
    return { node: updatedChar, blockId, pageId };
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

  remoteUpdate(operation: RemoteCharUpdateOperation): void {
    const updatedChar = this.LinkedList.nodeMap[JSON.stringify(operation.node.id)];
    updatedChar.style = [...operation.node.style];
  }

  serialize(): CRDTSerializedProps<Char> {
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
