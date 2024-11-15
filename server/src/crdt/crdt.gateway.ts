import {
  WebSocketGateway,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from "@nestjs/websockets";
import { Socket, Server } from "socket.io";
import { CrdtService } from "./crdt.service";
import {
  RemoteInsertOperation,
  RemoteDeleteOperation,
  CursorPosition,
} from "@noctaCrdt/Interfaces";

@WebSocketGateway({
  cors: {
    origin: "*",
  },
})
export class CrdtGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private server: Server;
  private clientIdCounter: number = 1;
  private clientMap: Map<string, number> = new Map();

  constructor(private readonly crdtService: CrdtService) {}

  afterInit(server: Server) {
    this.server = server;
  }

  async handleConnection(client: Socket) {
    console.log(`클라이언트 연결: ${client.id}`);
    const assignedId = (this.clientIdCounter += 1);
    this.clientMap.set(client.id, assignedId);
    client.emit("assignId", assignedId);
    const currentCRDT = this.crdtService.getCRDT().serialize();
    client.emit("document", currentCRDT);
  }

  handleDisconnect(client: Socket) {
    console.log(`클라이언트 연결 해제: ${client.id}`);
    this.clientMap.delete(client.id);
  }

  @SubscribeMessage("insert")
  async handleInsert(
    @MessageBody() data: RemoteInsertOperation,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    console.log(`Insert 연산 수신 from ${client.id}:`, data);
    await this.crdtService.handleInsert(data);
    client.broadcast.emit("insert", data);
  }

  @SubscribeMessage("delete")
  async handleDelete(
    @MessageBody() data: RemoteDeleteOperation,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    console.log(`Delete 연산 수신 from ${client.id}:`, data);
    await this.crdtService.handleDelete(data);
    client.broadcast.emit("delete", data);
  }

  @SubscribeMessage("cursor")
  handleCursor(@MessageBody() data: CursorPosition, @ConnectedSocket() client: Socket): void {
    console.log(`Cursor 위치 수신 from ${client.id}:`, data);
    client.broadcast.emit("cursor", data);
  }
}
