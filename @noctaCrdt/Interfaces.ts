import { NodeId, BlockId, CharId } from "./NodeId";
import { Block, Char } from "./Node";

export type ElementType = "p" | "h1" | "h2" | "h3" | "ul" | "ol" | "li" | "checkbox" | "blockquote";

export interface InsertOperation {
  node: Block | Char;
}

export interface DeleteOperation {
  targetId: BlockId | CharId;
  clock: number;
}

export interface RemoteInsertOperation {
  node: Block | Char;
}

export interface RemoteDeleteOperation {
  targetId: NodeId;
  clock: number;
}

export interface CursorPosition {
  clientId: number;
  position: number;
}

export interface SerializedProps<T> {
  // CRDT 직렬화라서 이름바꿔야함.
  clock: number;
  client: number;
  LinkedList: {
    head: NodeId | null;
    nodeMap: { [key: string]: T };
  };
}

// export interface WorkSpace {
//   id: string;
//   pageList: Page[];
//   authUser: object;
// }

// export interface Page {
//   id: string;
//   title: string;
//   icon: string; // 추후 수정
//   crdt: EditorCRDT;
// }
// export interface LinkedList {
//   head: NodeId | null;
//   nodeMap: { [key: string]: Block | Char };
// }

// export interface Block {
//   id: BlockId;
//   icon: string; // 추후 수정
//   type: ElementType;
//   animation: string;
//   crdt: BlockCRDT;
//   indent: number;
//   next: NodeId;
//   prev: NodeId;
//   style: string[];
// }

// export interface Char {
//   id: NodeId;
//   value: string;
//   next: NodeId | null;
//   prev: NodeId | null;
// }

// export interface BlockId {
//   clock: number;
//   client: number;
// }
