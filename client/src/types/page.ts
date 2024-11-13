export interface Page {
  id: number;
  title: string;
  icon: string;
  x: number;
  y: number;
  zIndex: number;
  isActive: boolean;
  isVisible: boolean;
}

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}
