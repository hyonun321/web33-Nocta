import { NodeId, Node } from "./Node";

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
