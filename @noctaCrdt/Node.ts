import { NodeId, BlockId, CharId } from "./NodeId";
import { BlockCRDT } from "./Crdt";
import { ElementType } from "./Interfaces";

export class Node<T extends NodeId> {
  id: T;
  value: string;
  next: T | null;
  prev: T | null;

  constructor(value: string, id: T) {
    this.id = id;
    this.value = value;
    this.next = null;
    this.prev = null;
  }

  precedes(node: Node<T>): boolean {
    if (!this.prev || !node.prev) return false;
    if (!this.prev.equals(node.prev)) return false;

    if (this.id.clock < node.id.clock) return true;
    if (this.id.clock === node.id.clock && this.id.client < node.id.client) return true;

    return false;
  }
}

export class Block extends Node<BlockId> {
  type: ElementType;
  indent: number;
  animation: string;
  style: string[];
  icon: string;
  crdt: BlockCRDT;

  constructor(value: string, id: BlockId) {
    super(value, id);
    this.type = "p";
    this.indent = 0;
    this.animation = "";
    this.style = [];
    this.icon = "";
    this.crdt = new BlockCRDT(id.client);
  }
}

export class Char extends Node<CharId> {
  constructor(value: string, id: CharId) {
    super(value, id);
  }
}
