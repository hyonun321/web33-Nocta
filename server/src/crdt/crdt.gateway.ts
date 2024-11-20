import {
  WebSocketGateway,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
  WsException,
} from "@nestjs/websockets";
import { Socket, Server } from "socket.io";
import { workSpaceService } from "./crdt.service";
import {
  RemoteBlockDeleteOperation,
  RemoteCharDeleteOperation,
  RemoteBlockInsertOperation,
  RemoteCharInsertOperation,
  CursorPosition,
} from "@noctaCrdt/Interfaces";
import { Logger } from "@nestjs/common";
import { NodeId } from "@noctaCrdt/NodeId";

// 클라이언트 맵 타입 정의
interface ClientInfo {
  clientId: number;
  connectionTime: Date;
}

@WebSocketGateway({
  cors: {
    origin:
      process.env.NODE_ENV === "development"
        ? "http://localhost:5173" // Vite 개발 서버 포트
        : ["https://nocta.site", "https://www.nocta.site"],
    credentials: true,
  },
  path: "/api/socket.io",
  transports: ["websocket", "polling"],
})
export class CrdtGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(CrdtGateway.name);
  private server: Server;
  private clientIdCounter: number = 1;
  private clientMap: Map<string, ClientInfo> = new Map();
  private guestMap;
  private guestIdCounter;
  constructor(private readonly workSpaceService: workSpaceService) {}

  afterInit(server: Server) {
    this.server = server;
  }
  /**
   * 클라이언트 연결 처리
   * 새로운 클라이언트에게 ID를 할당하고 현재 문서 상태를 전송
   */
  async handleConnection(client: Socket) {
    try {
      const assignedId = (this.clientIdCounter += 1);
      const clientInfo: ClientInfo = {
        clientId: assignedId,
        connectionTime: new Date(),
      };
      this.clientMap.set(client.id, clientInfo);

      // 클라이언트에게 ID 할당
      client.emit("assignId", assignedId);
      // 현재 문서 상태 전송
      const currentWorkSpace = await this.workSpaceService.getWorkspace().serialize();
      console.log(currentWorkSpace);
      client.emit("workspace", currentWorkSpace);

      // 다른 클라이언트들에게 새 사용자 입장 알림

      client.broadcast.emit("userJoined", { clientId: assignedId });

      this.logger.log(`클라이언트 연결 성공 - Socket ID: ${client.id}, Client ID: ${assignedId}`);
      this.logger.debug(`현재 연결된 클라이언트 수: ${this.clientMap.size}`);
    } catch (error) {
      this.logger.error(`클라이언트 연결 중 오류 발생: ${error.message}`, error.stack);
      client.disconnect();
    }
  }

  /**
   * 클라이언트 연결 해제 처리
   */
  handleDisconnect(client: Socket) {
    try {
      const clientInfo = this.clientMap.get(client.id);
      if (clientInfo) {
        // 다른 클라이언트들에게 사용자 퇴장 알림
        client.broadcast.emit("userLeft", { clientId: clientInfo.clientId });

        // 연결 시간 계산
        const connectionDuration = new Date().getTime() - clientInfo.connectionTime.getTime();
        this.logger.log(
          `클라이언트 연결 해제 - Socket ID: ${client.id}, ` +
            `Client ID: ${clientInfo.clientId}, ` +
            `연결 시간: ${Math.round(connectionDuration / 1000)}초`,
        );
      }

      this.clientMap.delete(client.id);
      this.logger.debug(`남은 연결된 클라이언트 수: ${this.clientMap.size}`);
    } catch (error) {
      this.logger.error(`클라이언트 연결 해제 중 오류 발생: ${error.message}`, error.stack);
    }
  }

  /**
   * 블록 삽입 연산 처리
   */
  @SubscribeMessage("insert/block")
  async handleBlockInsert(
    @MessageBody() data: RemoteBlockInsertOperation,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const clientInfo = this.clientMap.get(client.id);
    try {
      this.logger.debug(
        `Insert 연산 수신 - Client ID: ${clientInfo?.clientId}, Data:`,
        JSON.stringify(data),
      );
      // 클라이언트의 char 변경을 보고 char변경이 일어난 block정보를 나머지 client에게 broadcast한다.

      // block정보만 들어옴. block에는 Prev,next 정보가 다 있어서 어디에 들어갈지 안다.
      // await this.workSpaceService.getWorkspace().handleInsert(data);
      // 서버의 editorCRDT의 linkedList에 들어가야한다.
      // EditorCRDT가 반영이 되야한다~
      // 어디 workspace인지, 어디 페이지인지 확인한 후 블럭을 삽입해야 한다.

      console.log("블럭입니다", data);
      // const block = this.workSpaceService.getCRDT().LinkedList.getNode(data.node.id); // 변경이 일어난 block
      const block = "";
      client.broadcast.emit("insert/block", {
        operation: data,
        node: block,
        timestamp: new Date().toISOString(),
        sourceClientId: clientInfo?.clientId,
      });
    } catch (error) {
      this.logger.error(
        `Insert 연산 처리 중 오류 발생 - Client ID: ${clientInfo?.clientId}`,
        error.stack,
      );
      throw new WsException(`Insert 연산 실패: ${error.message}`);
    }
  }

  /**
   * 글자 삽입 연산 처리
   */
  @SubscribeMessage("insert/char")
  async handleCharInsert(
    @MessageBody() data: RemoteCharInsertOperation,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const clientInfo = this.clientMap.get(client.id);
    try {
      this.logger.debug(
        `Insert 연산 수신 - Client ID: ${clientInfo?.clientId}, Data:`,
        JSON.stringify(data),
      );

      // blockId 는 수신 받음
      // 원하는 block에 char node 를 삽입해야함 이제.

      const targetBlockCRDT = this.workSpaceService.getWorkspace();
      // await this.workSpaceService.handleCharInsert(data);
      console.log("char:", data);
      // const char = this.workSpaceService.getCRDT().LinkedList.getNode(data.node.id); // 변경이 일어난 block
      // !! TODO 블록 찾기

      // BlockCRDT

      // server는 EditorCRDT 없습니다. - BlockCRDT 로 사용되고있음.
      const char = "";
      client.broadcast.emit("insert/char", {
        operation: data,
        node: char,
        blockId: data.blockId, // TODO : char는 BlockID를 보내야한다? Block을 보내야한다? 고민예정.
        timestamp: new Date().toISOString(),
        sourceClientId: clientInfo?.clientId,
      });
    } catch (error) {
      this.logger.error(
        `Insert 연산 처리 중 오류 발생 - Client ID: ${clientInfo?.clientId}`,
        error.stack,
      );
      throw new WsException(`Insert 연산 실패: ${error.message}`);
    }
  }

  /**
   * 삭제 연산 처리
   */
  @SubscribeMessage("delete/block")
  async handleBlockDelete(
    @MessageBody() data: RemoteBlockDeleteOperation,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const clientInfo = this.clientMap.get(client.id);
    try {
      this.logger.debug(
        `Delete 연산 수신 - Client ID: ${clientInfo?.clientId}, Data:`,
        JSON.stringify(data),
      );

      const deleteNode = new NodeId(data.clock, data.targetId.client);
      // await this.workSpaceService.handleDelete({ targetId: deleteNode, clock: data.clock });

      client.broadcast.emit("delete", {
        ...data,
        timestamp: new Date().toISOString(),
        sourceClientId: clientInfo?.clientId,
      });
    } catch (error) {
      this.logger.error(
        `Delete 연산 처리 중 오류 발생 - Client ID: ${clientInfo?.clientId}`,
        error.stack,
      );
      throw new WsException(`Delete 연산 실패: ${error.message}`);
    }
  }

  /**
   * 삭제 연산 처리
   */
  @SubscribeMessage("delete/char")
  async handleCharDelete(
    @MessageBody() data: RemoteCharDeleteOperation,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const clientInfo = this.clientMap.get(client.id);
    try {
      this.logger.debug(
        `Delete 연산 수신 - Client ID: ${clientInfo?.clientId}, Data:`,
        JSON.stringify(data),
      );

      const deleteNode = new NodeId(data.clock, data.targetId.client);
      // await this.workSpaceService.handleDelete({ targetId: deleteNode, clock: data.clock }); // 얘도안됨

      client.broadcast.emit("delete/char", {
        ...data,
        timestamp: new Date().toISOString(),
        sourceClientId: clientInfo?.clientId,
      });
    } catch (error) {
      this.logger.error(
        `Delete 연산 처리 중 오류 발생 - Client ID: ${clientInfo?.clientId}`,
        error.stack,
      );
      throw new WsException(`Delete 연산 실패: ${error.message}`);
    }
  }

  /**
   * 커서 위치 업데이트 처리
   */
  @SubscribeMessage("cursor")
  handleCursor(@MessageBody() data: CursorPosition, @ConnectedSocket() client: Socket): void {
    const clientInfo = this.clientMap.get(client.id);
    try {
      this.logger.debug(
        `Cursor 위치 업데이트 - Client ID: ${clientInfo?.clientId}, Position:`,
        JSON.stringify(data),
      );

      // 커서 정보에 클라이언트 ID 추가하여 브로드캐스트
      client.broadcast.emit("cursor", {
        ...data,
        clientId: clientInfo?.clientId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error(
        `Cursor 업데이트 중 오류 발생 - Client ID: ${clientInfo?.clientId}`,
        error.stack,
      );
      throw new WsException(`Cursor 업데이트 실패: ${error.message}`);
    }
  }

  /**
   * 현재 연결된 모든 클라이언트 정보 조회
   */
  getConnectedClients(): { total: number; clients: ClientInfo[] } {
    return {
      total: this.clientMap.size,
      clients: Array.from(this.clientMap.values()),
    };
  }
}
