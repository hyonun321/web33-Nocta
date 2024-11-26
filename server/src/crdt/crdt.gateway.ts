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
  RemoteCharUpdateOperation,
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
      let { userId } = client.handshake.auth;
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
   * 페이지 참여 처리
   * 클라이언트가 특정 페이지에 참여할 때 호출됨
   */
  @SubscribeMessage("join/page")
  async handleJoinPage(
    @MessageBody() data: { pageId: string },
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const clientInfo = this.clientMap.get(client.id);
    if (!clientInfo) {
      throw new WsException("Client information not found");
    }

    try {
      const { pageId } = data;
      const { userId } = client.data;

      // 워크스페이스에서 해당 페이지 찾기
      const workspace = this.workSpaceService.getWorkspace(userId);
      const page = workspace.pageList.find((p) => p.id === pageId);

      // pageId에 가입 시키기
      client.join(pageId);
      if (!page) {
        throw new WsException(`Page with id ${pageId} not found`);
      }

      const start = process.hrtime();
      const [seconds, nanoseconds] = process.hrtime(start);
      this.logger.log(
        `Page join operation took ${seconds}s ${nanoseconds / 1000000}ms\n` +
          `Active connections: ${this.server.engine.clientsCount}\n` +
          `Connected clients: ${this.clientMap.size}`,
      );
      console.log(`Memory usage: ${process.memoryUsage().heapUsed}`),
        client.emit("join/page", {
          pageId,
          serializedPage: page.serialize(),
        });

      this.logger.log(`Client ${clientInfo.clientId} joined page ${pageId}`);
    } catch (error) {
      this.logger.error(
        `페이지 참여 중 오류 발생 - Client ID: ${clientInfo.clientId}`,
        error.stack,
      );
      throw new WsException(`페이지 참여 실패: ${error.message}`);
    }
  }

  /**
   * 페이지 퇴장 처리
   * 클라이언트가 특정 페이지에서 나갈 때 호출됨
   */
  @SubscribeMessage("leave/page")
  async handleLeavePage(
    @MessageBody() data: { pageId: string },
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const clientInfo = this.clientMap.get(client.id);
    if (!clientInfo) {
      throw new WsException("Client information not found");
    }

    try {
      const { pageId } = data;
      const { userId } = client.data;
      client.leave(pageId);

      this.logger.log(`Client ${clientInfo.clientId} leaved page ${pageId}`);
    } catch (error) {
      this.logger.error(
        `페이지 퇴장 중 오류 발생 - Client ID: ${clientInfo.clientId}`,
        error.stack,
      );
      throw new WsException(`페이지 퇴장 실패: ${error.message}`);
    }
  }

  /**
   * 페이지 삽입 연산 처리
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
      const { userId } = client.data;
      const workspace = this.workSpaceService.getWorkspace(userId);

      const newEditorCRDT = new EditorCRDT(data.clientId);
      const newPage = new Page(nanoid(), "새로운 페이지", "Docs", newEditorCRDT);
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
   * 페이지 삭제 연산 처리
   */
  @SubscribeMessage("delete/page")
  async handlePageDelete(
    @MessageBody() data: { workspaceId: string; pageId: string; clientId: number },
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const clientInfo = this.clientMap.get(client.id);
    try {
      this.logger.debug(
        `Page delete 연산 수신 - Client ID: ${clientInfo?.clientId}, Data:`,
        JSON.stringify(data),
      );
      const { userId } = client.data;
      // 현재 워크스페이스 가져오기
      const currentWorkspace = this.workSpaceService.getWorkspace(userId);

      // pageList에서 해당 페이지 찾기
      const pageIndex = currentWorkspace.pageList.findIndex((page) => page.id === data.pageId);

      if (pageIndex === -1) {
        throw new Error(`Page with id ${data.pageId} not found`);
      }

      // pageList에서 페이지 제거
      currentWorkspace.pageList.splice(pageIndex, 1);

      const operation = {
        workspaceId: data.workspaceId,
        pageId: data.pageId,
        clientId: data.clientId,
      };

      // 삭제 이벤트를 모든 클라이언트에게 브로드캐스트
      client.emit("delete/page", operation);
      client.broadcast.emit("delete/page", operation);

      this.logger.debug(`Page ${data.pageId} successfully deleted`);
    } catch (error) {
      this.logger.error(
        `Page Delete 연산 처리 중 오류 발생 - Client ID: ${clientInfo?.clientId}`,
        error.stack,
      );
      throw new WsException(`Page Delete 연산 실패: ${error.message}`);
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

      const { userId } = client.data;
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
      // 여기서 문제가?
      client.to(data.pageId).emit("update/block", operation);
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

      const { userId } = client.data;
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
      client.to(data.pageId).emit("insert/block", operation);
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
      console.log("인서트 char", data.pageId);
      this.logger.debug(
        `Insert 연산 수신 - Client ID: ${clientInfo?.clientId}, Data:`,
        JSON.stringify(data),
      );

      const { userId } = client.data;
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
        pageId: data.pageId,
        style: data.style || [],
        color: data.color ? data.color : "black",
        backgroundColor: data.backgroundColor ? data.backgroundColor : "transparent",
      };
      client.to(data.pageId).emit("insert/char", operation);
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
      console.log("딜리트 블록", data.pageId);
      this.logger.debug(
        `Delete 연산 수신 - Client ID: ${clientInfo?.clientId}, Data:`,
        JSON.stringify(data),
      );
      const { userId } = client.data;
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
      client.to(data.pageId).emit("delete/block", operation);
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
      console.log("딜리트 캐릭터", data.pageId);
      this.logger.debug(
        `Delete 연산 수신 - Client ID: ${clientInfo?.clientId}, Data:`,
        JSON.stringify(data),
      );
      const { userId } = client.data;
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
        pageId: data.pageId,
      };
      client.to(data.pageId).emit("delete/char", operation);
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
      const { userId } = client.data;
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
      client.to(data.pageId).emit("reorder/block", operation);
    } catch (error) {
      this.logger.error(
        `블록 Reorder 연산 처리 중 오류 발생 - Client ID: ${clientInfo?.clientId}`,
        error.stack,
      );
      throw new WsException(`Update 연산 실패: ${error.message}`);
    }
  }

  @SubscribeMessage("update/char")
  async handleCharUpdate(
    @MessageBody() data: RemoteCharUpdateOperation,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const clientInfo = this.clientMap.get(client.id);
    try {
      this.logger.debug(
        `Update 연산 수신 - Client ID: ${clientInfo?.clientId}, Data:`,
        JSON.stringify(data),
      );
      const { userId } = client.data;
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
      currentBlock.crdt.remoteUpdate(data);
      const operation = {
        node: data.node,
        blockId: data.blockId,
        pageId: data.pageId,
      };
      client.broadcast.emit("update/char", operation);
    } catch (error) {
      this.logger.error(
        `Char Update 연산 처리 중 오류 발생 - Client ID: ${clientInfo?.clientId}`,
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
      const { userId } = client.data;
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
