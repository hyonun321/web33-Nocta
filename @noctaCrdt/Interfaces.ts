import { NodeId, Node } from "./Node";

export type ElementType = "p" | "h1" | "h2" | "h3" | "ul" | "ol" | "li" | "checkbox" | "blockquote";

export interface InsertOperation {
  node: Node;
}

export interface DeleteOperation {
  targetId: NodeId | null;
  clock: number;
}
export interface RemoteInsertOperation {
  node: Node;
}

export interface RemoteDeleteOperation {
  targetId: NodeId | null;
  clock: number;
}

export interface CursorPosition {
  clientId: number;
  position: number;
}

export interface SerializedProps {
  clock: number;
  client: number;
  textLinkedList: {
    head: NodeId | null;
    nodeMap: { [key: string]: Node };
  };
}

export interface WorkSpace {
  id: string;
  pageList: Page[];
  authUser: object;
}

export interface Page {
  id: string;
  title: string;
  icon: string; // 추후 수정
  crdt: CRDT;
}

export interface CRDT {
  clock: number;
  client: number;
  LinkedList: LinkedList;
  localInsert(index: number, value: string): RemoteInsertOperation;
  localDelete(index: number): RemoteDeleteOperation;
  remoteInsert(operation: RemoteInsertOperation): void;
  remoteDelete(operation: RemoteDeleteOperation): void;
  read(): string;
  spread(): Block[] | Char[];
}

export interface LinkedList {
  head: NodeId | null;
  nodeMap: { [key: string]: Block | Char };
}

export interface Block {
  id: BlockId;
  icon: string; // 추후 수정
  type: ElementType;
  animation: string;
  crdt: CRDT;
  indent: number;
  next: NodeId;
  prev: NodeId;
  style: string[];
}

export interface Char {
  id: NodeId;
  value: string;
  next: NodeId | null;
  prev: NodeId | null;
}

export interface BlockId {
  clock: number;
  client: number;
}
