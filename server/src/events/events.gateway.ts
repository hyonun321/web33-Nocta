import { WebSocketGateway, WebSocketServer, SubscribeMessage } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

interface DocumentUpdate {
  content: string;
  // 필요한 경우 커서 위치, 사용자 정보 등 추가
}

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:5173',
    credentials: true,
  },
})
export class EventsGateway {
  @WebSocketServer()
  server: Server;

  private documentContent = ''; // 문서의 현재 상태를 저장

  handleConnection(client: Socket) {
    console.log(`클라이언트 연결: ${client.id}`);
    // 새로운 클라이언트에게 현재 문서 상태 전송
    client.emit('document', this.documentContent);
  }

  @SubscribeMessage('update')
  handleUpdate(client: Socket, payload: DocumentUpdate): void {
    console.log(`수신한 업데이트: ${payload.content}`);
    this.documentContent = payload.content; // 서버의 문서 상태 업데이트
    // 다른 클라이언트에게 변경 사항 브로드캐스트
    client.broadcast.emit('update', payload);
  }
}
