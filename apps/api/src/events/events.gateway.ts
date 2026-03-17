import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { WsJwtGuard } from '../auth/guards/ws-jwt.guard';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: 'events',
})
@UseGuards(WsJwtGuard)
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`客户端连接：${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`客户端断开：${client.id}`);
  }

  @SubscribeMessage('join:user')
  handleJoinUser(client: Socket, userId: string) {
    client.join(`user:${userId}`);
    console.log(`用户 ${userId} 加入房间`);
  }
}
