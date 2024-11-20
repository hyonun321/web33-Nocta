import { serializedEditorDataProps } from "@noctaCrdt/Interfaces";

export interface Page {
  id: string;
  title: string;
  icon: string;
  x: number;
  y: number;
  zIndex: number;
  isActive: boolean;
  isVisible: boolean;
  serializedEditorData: serializedEditorDataProps;
}

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}
