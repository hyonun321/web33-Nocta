import { LinkedList } from "./LinkedList";
import { CharId, BlockId, NodeId } from "./NodeId";
import { Node, Char, Block } from "./Node";
import { RemoteDeleteOperation, RemoteInsertOperation, SerializedProps } from "./Interfaces";

export class CRDT<T extends Node<NodeId>> {
  clock: number;
  client: number;
  LinkedList: LinkedList<T>;

  constructor(client: number) {
    this.clock = 0;
    this.client = client;
    this.LinkedList = new LinkedList<T>();
  }

  localInsert(index: number, value: string): RemoteInsertOperation {
    const id =
      this instanceof BlockCRDT
        ? new CharId(this.clock + 1, this.client)
        : new BlockId(this.clock + 1, this.client);

    const remoteInsertion = this.LinkedList.insertAtIndex(index, value, id);
    this.clock += 1;
    return { node: remoteInsertion.node };
  }

  localDelete(index: number): RemoteDeleteOperation {
    if (index < 0 || index >= this.LinkedList.spread().length) {
      throw new Error(`Invalid index: ${index}`);
    }

    const nodeToDelete = this.LinkedList.findByIndex(index);
    if (!nodeToDelete) {
      throw new Error(`Node not found at index: ${index}`);
    }

    const operation: RemoteDeleteOperation = {
      targetId: nodeToDelete.id,
      clock: this.clock + 1,
    };

    this.LinkedList.deleteNode(nodeToDelete.id);
    this.clock += 1;

    return operation;
  }

  remoteInsert(operation: RemoteInsertOperation): void {
    const NodeIdClass = this instanceof BlockCRDT ? CharId : BlockId;
    const NodeClass = this instanceof BlockCRDT ? Char : Block;

    const newNodeId = new NodeIdClass(operation.node.id.clock, operation.node.id.client);
    const newNode = new NodeClass(operation.node.value, newNodeId) as T;
    newNode.next = operation.node.next;
    newNode.prev = operation.node.prev;

    this.LinkedList.insertById(newNode);

    if (this.clock <= newNode.id.clock) {
      this.clock = newNode.id.clock + 1;
    }
  }

  remoteDelete(operation: RemoteDeleteOperation): void {
    const { targetId, clock } = operation;
    if (targetId) {
      this.LinkedList.deleteNode(targetId);
    }
    if (this.clock <= clock) {
      this.clock = clock + 1;
    }
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
      LinkedList: {
        head: this.LinkedList.head,
        nodeMap: this.LinkedList.nodeMap || {},
      },
    };
  }
}

export class EditorCRDT extends CRDT<Block> {
  currentBlock: Block | null;

  constructor(client: number) {
    super(client);
    this.currentBlock = null;
  }
}

export class BlockCRDT extends CRDT<Char> {
  currentCaret: number;

  constructor(client: number) {
    super(client);
    this.currentCaret = 0;
  }
}
