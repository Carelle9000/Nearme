import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, WebSocket } from 'ws';
import { StoreService } from '../store/store.service';
interface AuthedSocket extends WebSocket {
    userId?: string;
}
export declare class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly store;
    server: Server;
    private clients;
    constructor(store: StoreService);
    handleConnection(client: AuthedSocket, req: any): void;
    handleDisconnect(client: AuthedSocket): void;
    handleJoin(_client: AuthedSocket, _data: {
        match_id: string;
    }): void;
    handleSendMessage(client: AuthedSocket, data: {
        match_id: string;
        text: string;
    }): void;
    handleMarkRead(client: AuthedSocket, data: {
        match_id: string;
    }): void;
}
export {};
