import { EditorCRDT } from "@noctaCrdt/Crdt";

export interface Page {
  id: string;
  title: string;
  icon: string;
  x: number;
  y: number;
  zIndex: number;
  isActive: boolean;
  isVisible: boolean;
  editorCRDT: EditorCRDT;
}

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}
