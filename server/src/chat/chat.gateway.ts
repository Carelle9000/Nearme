import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, WebSocket } from 'ws';
import * as jwt from 'jsonwebtoken';
import { StoreService, MessageRecord } from '../store/store.service';
import { v4 as uuidv4 } from 'uuid';

interface AuthedSocket extends WebSocket {
  userId?: string;
}

@WebSocketGateway({ path: '/ws' })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private clients = new Map<string, AuthedSocket>();

  constructor(private readonly store: StoreService) {}

  handleConnection(client: AuthedSocket, req: any) {
    try {
      const url = new URL(req.url, 'ws://localhost');
      const token = url.searchParams.get('token');
      if (!token) { client.close(4001, 'No token'); return; }

      const payload = jwt.verify(
        token,
        process.env.JWT_SECRET ?? 'changeme_jwt_secret_32chars',
      ) as any;

      client.userId = payload.sub;
      this.clients.set(client.userId!, client);
    } catch {
      client.close(4001, 'Invalid token');
    }
  }

  handleDisconnect(client: AuthedSocket) {
    if (client.userId) this.clients.delete(client.userId);
  }

  @SubscribeMessage('join')
  handleJoin(
    @ConnectedSocket() _client: AuthedSocket,
    @MessageBody() _data: { match_id: string },
  ) {}

  @SubscribeMessage('send_message')
  handleSendMessage(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() data: { match_id: string; text: string },
  ) {
    if (!client.userId) return;

    const now = new Date();
    const msg: MessageRecord = {
      id: uuidv4(),
      matchId: data.match_id,
      senderId: client.userId,
      text: data.text,
      sentAt: now,
      readAt: null,
      updatedAt: now,
    };
    this.store.messages.set(msg.id, msg);

    const match = this.store.matches.get(data.match_id);
    if (!match) return;

    const outbound = JSON.stringify({
      event: 'new_message',
      data: {
        id: msg.id,
        match_id: msg.matchId,
        sender_id: msg.senderId,
        text: msg.text,
        sent_at: msg.sentAt.toISOString(),
        read_at: null,
      },
    });

    [match.userId1, match.userId2].forEach((uid) => {
      const sock = this.clients.get(uid);
      if (sock?.readyState === WebSocket.OPEN) sock.send(outbound);
    });
  }

  @SubscribeMessage('mark_read')
  handleMarkRead(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() data: { match_id: string },
  ) {
    if (!client.userId) return;

    const now = new Date();
    for (const msg of this.store.messages.values()) {
      if (
        msg.matchId === data.match_id &&
        msg.senderId !== client.userId &&
        !msg.readAt
      ) {
        msg.readAt   = now;
        msg.updatedAt = now;
      }
    }
  }
}
