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
  RemoteBlockUpdateOperation,
  RemotePageCreateOperation,
  RemoteBlockReorderOperation,
  CursorPosition,
} from "@noctaCrdt/Interfaces";
import { Logger } from "@nestjs/common";
import { nanoid } from "nanoid";
import { Page } from "@noctaCrdt/Page";
import { EditorCRDT } from "@noctaCrdt/Crdt";
import { JwtService } from "@nestjs/jwt";
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
  constructor(
    private readonly workSpaceService: workSpaceService,
    private readonly jwtService: JwtService, // JwtService 주입
  ) {}
  afterInit(server: Server) {
    this.server = server;
  }
  /**
   * 클라이언트 연결 처리
   * 새로운 클라이언트에게 ID를 할당하고 현재 문서 상태를 전송
   */
  async handleConnection(client: Socket) {
    try {
      let userId = null;
      userId = client.handshake.auth.userId;
      if (!userId) {
        userId = "guest";
      }
      client.data.userId = userId;
      client.join(userId);
      // userId라는 방.
      const currentWorkSpace = await this.workSpaceService.getWorkspace(userId).serialize();
      client.emit("workspace", currentWorkSpace);

      const assignedId = (this.clientIdCounter += 1);
      const clientInfo: ClientInfo = {
        clientId: assignedId,
        connectionTime: new Date(),
      };
      this.clientMap.set(client.id, clientInfo);
      console.log(userId, "유저아이디 체크");
      client.emit("assign/clientId", assignedId);

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
  @SubscribeMessage("create/page")
  async handlePageCreate(
    @MessageBody() data: RemotePageCreateOperation,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const clientInfo = this.clientMap.get(client.id);
    try {
      this.logger.debug(
        `Page create 연산 수신 - Client ID: ${clientInfo?.clientId}, Data:`,
        JSON.stringify(data),
      );
      const userId = client.data.userId;
      const workspace = this.workSpaceService.getWorkspace(userId);

      const newEditorCRDT = new EditorCRDT(data.clientId);
      const newPage = new Page(nanoid(), "새로운 페이지", "📄", newEditorCRDT);
      workspace.pageList.push(newPage);

      const operation = {
        workspaceId: data.workspaceId,
        clientId: data.clientId,
        page: newPage.serialize(),
      };
      client.emit("create/page", operation);
      client.to(userId).emit("create/page", operation);
    } catch (error) {
      this.logger.error(
        `Page Create 연산 처리 중 오류 발생 - Client ID: ${clientInfo?.clientId}`,
        error.stack,
      );
      throw new WsException(`Page Create 연산 실패: ${error.message}`);
    }
  }
  /**
   * 블록 업데이트 연산 처리
   */
  @SubscribeMessage("update/block")
  async handleBlockUpdate(
    @MessageBody() data: RemoteBlockUpdateOperation,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const clientInfo = this.clientMap.get(client.id);
    try {
      this.logger.debug(
        `블록 Update 연산 수신 - Client ID: ${clientInfo?.clientId}, Data:`,
        JSON.stringify(data),
      );

      const userId = client.data.userId;
      const workspace = this.workSpaceService.getWorkspace(userId);

      const currentPage = workspace.pageList.find((p) => p.id === data.pageId);
      if (!currentPage) {
        throw new Error(`Page with id ${data.pageId} not found`);
      }
      currentPage.crdt.remoteUpdate(data.node, data.pageId);

      const operation = {
        node: data.node,
        pageId: data.pageId,
      } as RemoteBlockUpdateOperation;
      client.to(userId).emit("update/block", operation);
    } catch (error) {
      this.logger.error(
        `블록 Update 연산 처리 중 오류 발생 - Client ID: ${clientInfo?.clientId}`,
        error.stack,
      );
      throw new WsException(`Update 연산 실패: ${error.message}`);
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

      const userId = client.data.userId;
      const currentPage = this.workSpaceService
        .getWorkspace(userId)
        .pageList.find((p) => p.id === data.pageId);
      if (!currentPage) {
        throw new Error(`Page with id ${data.pageId} not found`);
      }

      currentPage.crdt.remoteInsert(data);
      const operation = {
        node: data.node,
        pageId: data.pageId,
      };
      client.to(userId).emit("insert/block", operation);
    } catch (error) {
      this.logger.error(
        `Block Insert 연산 처리 중 오류 발생 - Client ID: ${clientInfo?.clientId}`,
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

      const userId = client.data.userId;
      const currentPage = this.workSpaceService
        .getWorkspace(userId)
        .pageList.find((p) => p.id === data.pageId);
      if (!currentPage) {
        throw new Error(`Page with id ${data.pageId} not found`);
      }
      const currentBlock = currentPage.crdt.LinkedList.nodeMap[JSON.stringify(data.blockId)];
      // currentBlock 이 block 인스턴스가 아님
      if (!currentBlock) {
        throw new Error(`Block with id ${data.blockId} not found`);
      }
      currentBlock.crdt.remoteInsert(data);
      // server는 EditorCRDT 없습니다. - BlockCRDT 로 사용되고있음.
      const operation = {
        node: data.node,
        blockId: data.blockId,
      };
      client.to(userId).emit("insert/char", operation);
    } catch (error) {
      this.logger.error(
        `Char Insert 연산 처리 중 오류 발생 - Client ID: ${clientInfo?.clientId}`,
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
      const userId = client.data.userId;
      const currentPage = this.workSpaceService
        .getWorkspace(userId)
        .pageList.find((p) => p.id === data.pageId);
      if (!currentPage) {
        throw new Error(`Page with id ${data.pageId} not found`);
      }
      currentPage.crdt.remoteDelete(data);
      const operation = {
        targetId: data.targetId,
        clock: data.clock,
        pageId: data.pageId,
      };
      client.to(userId).emit("delete/block", operation);
    } catch (error) {
      this.logger.error(
        `Block Delete 연산 처리 중 오류 발생 - Client ID: ${clientInfo?.clientId}`,
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
      const userId = client.data.userId;
      const currentPage = this.workSpaceService
        .getWorkspace(userId)
        .pageList.find((p) => p.id === data.pageId);
      if (!currentPage) {
        throw new Error(`Page with id ${data.pageId} not found`);
      }
      const currentBlock = currentPage.crdt.LinkedList.nodeMap[JSON.stringify(data.blockId)];
      if (!currentBlock) {
        throw new Error(`Block with id ${data.blockId} not found`);
      }
      currentBlock.crdt.remoteDelete(data);

      const operation = {
        targetId: data.targetId,
        clock: data.clock,
        blockId: data.blockId,
      };
      client.to(userId).emit("delete/char", operation);
    } catch (error) {
      this.logger.error(
        `Char Delete 연산 처리 중 오류 발생 - Client ID: ${clientInfo?.clientId}`,
        error.stack,
      );
      throw new WsException(`Delete 연산 실패: ${error.message}`);
    }
  }

  @SubscribeMessage("reorder/block")
  async handleBlockReorder(
    @MessageBody() data: RemoteBlockReorderOperation,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const clientInfo = this.clientMap.get(client.id);
    try {
      this.logger.debug(
        `블록 Reorder 연산 수신 - Client ID: ${clientInfo?.clientId}, Data:`,
        JSON.stringify(data),
      );
      const userId = client.data.userId;
      const workspace = this.workSpaceService.getWorkspace(userId);

      const currentPage = workspace.pageList.find((p) => p.id === data.pageId);
      if (!currentPage) {
        throw new Error(`Page with id ${data.pageId} not found`);
      }
      currentPage.crdt.remoteReorder(data);

      // 5. 다른 클라이언트들에게 업데이트된 블록 정보 브로드캐스트
      const operation = {
        targetId: data.targetId,
        beforeId: data.beforeId,
        afterId: data.afterId,
        pageId: data.pageId,
      } as RemoteBlockReorderOperation;
      client.to(userId).emit("reorder/block", operation);
    } catch (error) {
      this.logger.error(
        `블록 Reorder 연산 처리 중 오류 발생 - Client ID: ${clientInfo?.clientId}`,
        error.stack,
      );
      throw new WsException(`Update 연산 실패: ${error.message}`);
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

      const operation = {
        clientId: clientInfo?.clientId,
        position: data.position,
      };
      const userId = client.data.userId;
      client.to(userId).emit("cursor", operation);
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
