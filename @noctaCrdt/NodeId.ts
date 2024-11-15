export class NodeId {
  clock: number;
  client: number;

  constructor(clock: number, client: number) {
    this.clock = clock;
    this.client = client;
  }

  equals(other: NodeId): boolean {
    return this.clock === other.clock && this.client === other.client;
  }
}

export class BlockId extends NodeId {}

export class CharId extends NodeId {}
