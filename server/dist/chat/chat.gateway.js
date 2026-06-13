"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const ws_1 = require("ws");
const jwt = require("jsonwebtoken");
const store_service_1 = require("../store/store.service");
const uuid_1 = require("uuid");
let ChatGateway = class ChatGateway {
    constructor(store) {
        this.store = store;
        this.clients = new Map();
    }
    handleConnection(client, req) {
        try {
            const url = new URL(req.url, 'ws://localhost');
            const token = url.searchParams.get('token');
            if (!token) {
                client.close(4001, 'No token');
                return;
            }
            const payload = jwt.verify(token, process.env.JWT_SECRET ?? 'changeme_jwt_secret_32chars');
            client.userId = payload.sub;
            this.clients.set(client.userId, client);
        }
        catch {
            client.close(4001, 'Invalid token');
        }
    }
    handleDisconnect(client) {
        if (client.userId)
            this.clients.delete(client.userId);
    }
    handleJoin(_client, _data) { }
    handleSendMessage(client, data) {
        if (!client.userId)
            return;
        const now = new Date();
        const msg = {
            id: (0, uuid_1.v4)(),
            matchId: data.match_id,
            senderId: client.userId,
            text: data.text,
            sentAt: now,
            readAt: null,
            updatedAt: now,
        };
        this.store.messages.set(msg.id, msg);
        const match = this.store.matches.get(data.match_id);
        if (!match)
            return;
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
            if (sock?.readyState === ws_1.WebSocket.OPEN)
                sock.send(outbound);
        });
    }
    handleMarkRead(client, data) {
        if (!client.userId)
            return;
        const now = new Date();
        for (const msg of this.store.messages.values()) {
            if (msg.matchId === data.match_id &&
                msg.senderId !== client.userId &&
                !msg.readAt) {
                msg.readAt = now;
                msg.updatedAt = now;
            }
        }
    }
};
exports.ChatGateway = ChatGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", ws_1.Server)
], ChatGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('join'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleJoin", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('send_message'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleSendMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('mark_read'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleMarkRead", null);
exports.ChatGateway = ChatGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({ path: '/ws' }),
    __metadata("design:paramtypes", [store_service_1.StoreService])
], ChatGateway);
//# sourceMappingURL=chat.gateway.js.map