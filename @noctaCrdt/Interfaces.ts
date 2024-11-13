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

export interface SerializedProps {
  clock: number;
  client: number;
  textLinkedList: {
    head: NodeId | null;
    nodeMap: { [key: string]: Node };
  };
}
