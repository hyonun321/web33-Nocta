import { v4 as uuidv4 } from "uuid";
import { EditorNode, ElementType } from "../types/markdown";

export class LinkedListBlock {
  root: EditorNode | null;
  current: EditorNode | null;

  constructor() {
    const initialNode = this.createNode("p", "", null, null);
    this.root = initialNode;
    this.current = initialNode;
  }
  // 새로운 노드 생성
  createNode(
    type: ElementType = "p",
    content: string = "",
    prevNode: EditorNode | null,
    nextNode: EditorNode | null,
    depth: number = 0,
  ): EditorNode {
    return {
      id: uuidv4(),
      type,
      content,
      prevNode,
      nextNode,
      parentNode: null,
      firstChild: null,
      prevSibling: null,
      nextSibling: null,
      depth,
      order: 0,
      listProperties:
        type === "ul" ? { bulletStyle: "disc" } : type === "ol" ? { index: 1 } : undefined,
    };
  }

  // 노드를 다른 노드 뒤에 삽입
  insertAfter(newNode: EditorNode, afterNode: EditorNode): void {
    newNode.prevNode = afterNode;
    newNode.nextNode = afterNode.nextNode;

    if (afterNode.nextNode) {
      afterNode.nextNode.prevNode = newNode;
    }

    afterNode.nextNode = newNode;
  }

  // 노드 삭제
  removeNode(node: EditorNode): void {
    // 부모-자식 관계 정리
    if (node.parentNode) {
      if (node.parentNode.firstChild === node) {
        node.parentNode.firstChild = node.nextSibling;
      }
      node.parentNode = null;
    }

    // 형제 관계 정리
    if (node.prevSibling) {
      node.prevSibling.nextSibling = node.nextSibling;
    }
    if (node.nextSibling) {
      node.nextSibling.prevSibling = node.prevSibling;
    }

    // 수평 관계 정리
    if (node.prevNode) {
      node.prevNode.nextNode = node.nextNode;
    }
    if (node.nextNode) {
      node.nextNode.prevNode = node.prevNode;
    }

    // firstChild가 있는 경우 관계 정리
    if (node.firstChild) {
      node.firstChild.parentNode = null;
      node.firstChild = null;
    }

    // root 노드인 경우 업데이트
    if (node === this.root) {
      this.root = node.nextNode;
    }

    // 현재 노드인 경우 업데이트
    if (node === this.current) {
      this.current = node.prevNode || node.nextNode;
    }

    // 노드의 모든 참조 제거
    Object.keys(node).forEach((key) => {
      delete (node as any)[key];
    });
  }

  // 특정 ID를 가진 노드 찾기
  findNodeById(id: string): EditorNode | null {
    const find = (node: EditorNode | null): EditorNode | null => {
      if (!node) return null;
      if (node.id === id) return node;
      if (node.type === "ul" || node.type === "ol") {
        let child = node.firstChild;
        while (child) {
          if (child.id === id) return child;
          child = child.nextSibling;
        }
      }
      if (node.type === "checkbox") {
        return node.firstChild;
      }
      return find(node.nextNode);
    };

    return find(this.root);
  }

  // 마지막 자식 노드 찾기
  getLastChild(node: EditorNode): EditorNode {
    let lastChild = node.firstChild!;
    if (!lastChild.nextSibling?.id) {
      return lastChild;
    } else {
      while (lastChild.nextSibling?.id) {
        lastChild = lastChild.nextSibling;
      }
      return lastChild;
    }
  }

  // 노드를 순회하며 배열로 변환
  traverseNodes(): EditorNode[] {
    const result: EditorNode[] = [];
    const visited = new Set<string>(); // 방문한 노드 추적

    let current = this.root;
    while (current) {
      // 이미 방문한 노드라면 순환 참조로 판단하고 중단
      if (visited.has(current.id)) {
        console.error("순환참조 에러 -> 뭐임?");
        break;
      }

      visited.add(current.id);
      result.push(current);
      current = current.nextNode;
    }

    return result;
  }
}
