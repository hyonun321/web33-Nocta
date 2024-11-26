import { NodeId, BlockId, CharId } from "./NodeId";
import { Block, Char } from "./Node";
import { Page } from "./Page";
import { EditorCRDT } from "./Crdt";

export type ElementType = "p" | "h1" | "h2" | "h3" | "ul" | "ol" | "li" | "checkbox" | "blockquote";

export type AnimationType = "none" | "highlight" | "gradation";

export type TextStyleType = "bold" | "italic" | "underline" | "strikethrough";

export type BackgroundColorType =
  | "black"
  | "red"
  | "green"
  | "blue"
  | "white"
  | "yellow"
  | "purple"
  | "brown"
  | "transparent";

export type TextColorType = Exclude<BackgroundColorType, "transparent">;

export interface InsertOperation {
  node: Block | Char;
}

export interface DeleteOperation {
  targetId: BlockId | CharId;
  clock: number;
}

export interface RemotePageCreateOperation {
  clientId: number;
  workspaceId: string;
  page?: Page;
}

export interface RemotePageDeleteOperation {
  clientId: number;
  workspaceId: string;
  pageId: string;
}

export interface RemoteBlockUpdateOperation {
  node: Block;
  pageId: string;
}

export interface RemoteBlockInsertOperation {
  node: Block;
  pageId: string;
}

export interface RemoteCharInsertOperation {
  node: Char;
  blockId: BlockId;
  pageId: string;
  style?: string[];
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
  pageId: string;
}

export interface RemoteCharUpdateOperation {
  node: Char;
  blockId: BlockId;
  pageId: string;
}

export interface CursorPosition {
  clientId: number;
  position: number;
}

export interface CRDTSerializedProps<T> {
  clock: number;
  client: number;
  LinkedList: {
    head: NodeId | null;
    nodeMap: { [key: string]: T };
  };
  currentBlock?: Block | null;
  currentCaret?: number | null;
}

export interface serializedEditorDataProps {
  clock: number;
  client: number;
  LinkedList: {
    head: NodeId | null;
    nodeMap: { [key: string]: Block };
  };
  currentBlock: Block | null;
}

export interface serializedPageProps {
  id: string;
  title: string;
  icon: string;
  crdt: EditorCRDT;
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
export interface RemoteBlockReorderOperation {
  targetId: BlockId;
  beforeId: BlockId | null;
  afterId: BlockId | null;
  clock: number;
  client: number;
  pageId: string;
}
