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
  CursorPosition,
} from "@noctaCrdt/Interfaces";
import { Logger } from "@nestjs/common";
import { BlockId, CharId } from "@noctaCrdt/NodeId";

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
      // 1. 워크스페이스 가져오기
      const workspace = this.workSpaceService.getWorkspace();

      // 2. 해당 페이지 가져오기
      const pageId = data.pageId;
      const page = workspace.pageList.find((p) => p.id === pageId);
      if (!page) {
        throw new Error(`Page with id ${pageId} not found`);
      }

      // 3. 업데이트된 블록 정보를 페이지의 CRDT에 적용
      page.crdt.remoteUpdate(data.node);

      // 5. 다른 클라이언트들에게 업데이트된 블록 정보 브로드캐스트
      const operation = {
        node: data.node,
        pageId: data.pageId,
      };
      client.broadcast.emit("update/block", operation);
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
      // TODO 클라이언트로부터 받은 정보를 서버의 인스턴스에 저장한다. 
      
      console.log("블럭입니다", data);
      
      // 몇번 page의 editorCRDT에 추가가 되냐 
      const currentPage = this.workSpaceService.getWorkspace().pageList.find((p) => p.id === data.pageId);
      if (!currentPage) {
        throw new Error(`Page with id ${data.pageId} not found`);
      }

      currentPage.crdt.LinkedList.insertById(data.node);

      const operation = {
        node: data.node,
        pageId: data.pageId,
      };
      client.broadcast.emit("insert/block", operation);
      
      
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
      // await this.workSpaceService.handleCharInsert(data);getNode(data.node.id); // 변경이 일어난 block
      // !! TODO 블록 찾기

      // BlockCRDT

      // server는 EditorCRDT 없습니다. - BlockCRDT 로 사용되고있음.
      const operation = {
        node: data.node,
        blockId: data.blockId,
      };
      client.broadcast.emit("insert/char", operation);
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

      const deleteNode = new BlockId(data.clock, data.targetId.client);
      // await this.workSpaceService.handleDelete({ targetId: deleteNode, clock: data.clock });
      const operation = {
        targetId: data.targetId,
        clock: data.clock,
        pageId: data.pageId,
      };
      console.log("블럭 삭제", operation);
      client.broadcast.emit("delete/block", operation);
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

      const deleteNode = new CharId(data.clock, data.targetId.client);
      // await this.workSpaceService.handleDelete({ targetId: deleteNode, clock: data.clock }); // 얘도안됨
      const operation = {
        targetId: data.targetId,
        clock: data.clock,
        blockId: data.blockId,
      };
      client.broadcast.emit("delete/char", operation);
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

      const operation = {
        clientId: clientInfo?.clientId,
        position: data.position,
      };
      // 커서 정보에 클라이언트 ID 추가하여 브로드캐스트
      client.broadcast.emit("cursor", operation);
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
