import { Node, Char, Block } from "./Node";
import { NodeId } from "./NodeId";
import { InsertOperation } from "./Interfaces";

export class LinkedList<T extends Node<NodeId>> {
  head: T["id"] | null;
  nodeMap: { [key: string]: T };

  constructor(initialStructure?: LinkedList<T>) {
    if (initialStructure) {
      this.head = initialStructure.head;
      this.nodeMap = { ...initialStructure.nodeMap };
    } else {
      this.head = null;
      this.nodeMap = {};
    }
  }

  setNode(id: T["id"], node: T): void {
    this.nodeMap[JSON.stringify(id)] = node;
  }

  getNode(id: T["id"] | null): T | null {
    if (!id) return null;
    return this.nodeMap[JSON.stringify(id)] || null;
  }

  deleteNode(id: T["id"]): void {
    const nodeToDelete = this.getNode(id);
    if (!nodeToDelete) return;

    if (this.head && id.equals(this.head)) {
      this.head = nodeToDelete.next;
      if (nodeToDelete.next) {
        const nextNode = this.getNode(nodeToDelete.next);
        if (nextNode) {
          nextNode.prev = null;
        }
      }
    } else {
      if (nodeToDelete.prev) {
        const prevNode = this.getNode(nodeToDelete.prev);
        if (prevNode) {
          prevNode.next = nodeToDelete.next;
          if (nodeToDelete.next) {
            const nextNode = this.getNode(nodeToDelete.next);
            if (nextNode) {
              nextNode.prev = nodeToDelete.prev;
            }
          }
        }
      }
    }

    delete this.nodeMap[JSON.stringify(id)];
  }

  findByIndex(index: number): T {
    if (index < 0) {
      throw new Error(`Invalid negative index: ${index}`);
    }

    let currentNodeId = this.head;
    let currentIndex = 0;

    while (currentNodeId !== null && currentIndex < index) {
      const currentNode = this.getNode(currentNodeId);
      if (!currentNode) {
        throw new Error(`Node not found at index ${currentIndex}`);
      }
      currentNodeId = currentNode.next;
      currentIndex += 1;
    }

    if (currentNodeId === null) {
      throw new Error(`LinkedList is empty at index ${index}`);
    }

    const node = this.getNode(currentNodeId);
    if (!node) {
      throw new Error(`Node not found at index ${index}`);
    }

    return node;
  }

  insertAtIndex(index: number, value: string, id: T["id"]): InsertOperation {
    try {
      const node = new Node(value, id) as T;
      this.setNode(id, node);

      if (!this.head || index <= 0) {
        node.next = this.head;
        node.prev = null;
        if (this.head) {
          const oldHead = this.getNode(this.head);
          if (oldHead) {
            oldHead.prev = id;
          }
        }

        this.head = id;
        return { node };
      }

      const prevNode = this.findByIndex(index - 1);
      node.next = prevNode.next;
      prevNode.next = id;
      node.prev = prevNode.id;

      if (node.next) {
        const nextNode = this.getNode(node.next);
        if (nextNode) {
          nextNode.prev = id;
        }
      }

      return { node };
    } catch (e) {
      throw new Error(`InsertAtIndex failed: ${e}`);
    }
  }

  insertById(node: T): void {
    if (this.getNode(node.id)) return;

    if (!node.prev) {
      node.next = this.head;
      node.prev = null;

      if (this.head) {
        const oldHead = this.getNode(this.head);
        if (oldHead) {
          oldHead.prev = node.id;
        }
      }

      this.head = node.id;
      this.setNode(node.id, node);
      return;
    }

    const prevNode = this.getNode(node.prev);
    if (!prevNode) {
      throw new Error(`Previous node not found: ${JSON.stringify(node.prev)}`);
    }

    node.next = prevNode.next;
    node.prev = prevNode.id;
    prevNode.next = node.id;

    if (node.next) {
      const nextNode = this.getNode(node.next);
      if (nextNode) {
        nextNode.prev = node.id;
      }
    }

    this.setNode(node.id, node);
  }

  stringify(): string {
    let currentNodeId = this.head;
    let result = "";

    while (currentNodeId !== null) {
      const currentNode = this.getNode(currentNodeId);
      if (!currentNode) break;
      result += currentNode.value;
      currentNodeId = currentNode.next;
    }

    return result;
  }

  spread(): T[] {
    let currentNodeId = this.head;
    const result: T[] = [];
    while (currentNodeId !== null) {
      const currentNode = this.getNode(currentNodeId);
      if (!currentNode) break;
      result.push(currentNode);
      currentNodeId = currentNode.next;
    }
    return result;
  }
}

export class BlockLinkedList extends LinkedList<Block> {}

export class TextLinkedList extends LinkedList<Char> {}
