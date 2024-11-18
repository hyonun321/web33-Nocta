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

export interface RemoteBlockInsertOperation {
  node: Block;
}

export interface RemoteCharInsertOperation {
  node: Char;
  blockId: BlockId;
}

export interface RemoteBlockDeleteOperation {
  targetId: NodeId;
  clock: number;
}

export interface RemoteCharDeleteOperation {
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

export interface ReorderNodesProps {
  targetId: BlockId;
  beforeId: BlockId | null;
  afterId: BlockId | null;
}

export interface RemoteReorderOperation {
  targetId: NodeId;
  beforeId: NodeId | null;
  afterId: NodeId | null;
  clock: number;
  client: number;
}
