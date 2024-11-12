export type ElementType = "p" | "h1" | "h2" | "h3" | "ul" | "ol" | "li" | "checkbox" | "blockquote";

export interface ListProperties {
  index?: number;
  bulletStyle?: string;
}

export interface MarkdownElement {
  type: ElementType;
  attributes?: Record<string, string>;
}

export interface EditorNode {
  id: string;
  type: ElementType;
  content: string;
  attributes?: Record<string, any>;

  // 수평 연결 (같은 레벨의 노드들 간 연결)
  prevNode: EditorNode | null;
  nextNode: EditorNode | null;

  // 수직 연결 (부모-자식 관계)
  parentNode: EditorNode | null;
  firstChild: EditorNode | null; // 배열 대신 첫 번째 자식만 참조

  // 형제 노드 간 연결 (같은 부모를 가진 노드들 간 연결)
  prevSibling: EditorNode | null;
  nextSibling: EditorNode | null;

  depth: number;
  order: number;
  listProperties?: ListProperties;
}

export interface EditorState {
  rootNode: EditorNode | null;
  currentNode: EditorNode | null;
}

export interface MarkdownPattern {
  regex: RegExp;
  length: number;
  createElement: () => MarkdownElement;
}
