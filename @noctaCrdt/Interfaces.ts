import { NodeId, BlockId, CharId } from "./NodeId";
import { Block, Char } from "./Node";
import { Page } from "./Page";

export type ElementType = "p" | "h1" | "h2" | "h3" | "ul" | "ol" | "li" | "checkbox" | "blockquote";

export interface InsertOperation {
  node: Block | Char;
}

export interface DeleteOperation {
  targetId: BlockId | CharId;
  clock: number;
}

export interface RemoteBlockUpdateOperation {
  node: Block;
}
export interface RemoteBlockInsertOperation {
  node: Block;
  pageId: string;
}

export interface RemoteCharInsertOperation {
  node: Char;
  blockId: BlockId;
}

export interface RemoteBlockDeleteOperation {
  targetId: BlockId;
  clock: number;
  pageId: string;
}

export interface RemoteCharDeleteOperation {
  targetId: CharId;
  clock: number;
  blockId?: BlockId;
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

export interface WorkSpaceSerializedProps {
  id: string;
  pageList: Page[];
  authUser: Map<string, string>;
}
export interface RemoteReorderOperation {
  targetId: BlockId;
  beforeId: BlockId | null;
  afterId: BlockId | null;
  clock: number;
  client: number;
}
