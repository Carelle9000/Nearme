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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncService = void 0;
const common_1 = require("@nestjs/common");
const store_service_1 = require("../store/store.service");
const uuid_1 = require("uuid");
let SyncService = class SyncService {
    constructor(store) {
        this.store = store;
    }
    push(userId, payload) {
        const now = new Date();
        for (const p of payload.profiles ?? []) {
            const existing = this.store.profiles.get(p.id ?? p.user_id);
            const updated = {
                id: p.id ?? (0, uuid_1.v4)(),
                userId: p.user_id ?? userId,
                name: p.name ?? '',
                gender: p.gender ?? null,
                heightCm: p.height_cm ?? null,
                bio: p.bio ?? null,
                intention: p.intention ?? null,
                location: p.location ?? null,
                interestsJson: JSON.stringify(p.interests ?? []),
                photosJson: JSON.stringify(p.photos ?? []),
                isFaceVerified: p.is_face_verified ?? false,
                updatedAt: existing?.updatedAt ?? now,
            };
            this.store.profiles.set(updated.userId, updated);
        }
        for (const l of payload.likes ?? []) {
            const record = {
                id: l.id ?? (0, uuid_1.v4)(),
                fromUserId: l.from_user_id,
                toUserId: l.to_user_id,
                superLike: l.super_like ?? false,
                updatedAt: now,
            };
            this.store.likes.set(record.id, record);
        }
        for (const m of payload.matches ?? []) {
            const record = {
                id: m.id ?? (0, uuid_1.v4)(),
                userId1: m.user_id_1,
                userId2: m.user_id_2,
                matchedAt: m.matched_at ? new Date(m.matched_at) : now,
                updatedAt: now,
            };
            this.store.matches.set(record.id, record);
        }
        for (const msg of payload.messages ?? []) {
            const existing = this.store.messages.get(msg.id);
            const record = {
                id: msg.id ?? (0, uuid_1.v4)(),
                matchId: msg.match_id,
                senderId: msg.sender_id,
                text: msg.text,
                sentAt: msg.sent_at ? new Date(msg.sent_at) : now,
                readAt: msg.read_at ? new Date(msg.read_at) : (existing?.readAt ?? null),
                updatedAt: now,
            };
            this.store.messages.set(record.id, record);
        }
        for (const s of payload.shared_spots ?? []) {
            const record = {
                id: s.id ?? (0, uuid_1.v4)(),
                userId: s.user_id ?? userId,
                name: s.name,
                lat: s.lat ?? null,
                lng: s.lng ?? null,
                visitedAt: s.visited_at ? new Date(s.visited_at) : now,
                updatedAt: now,
            };
            this.store.sharedSpots.set(record.id, record);
        }
        return { ok: true, synced_at: now.toISOString() };
    }
    pull(userId, lastSync) {
        const since = lastSync ?? new Date(0);
        const profiles = [...this.store.profiles.values()].filter((p) => p.updatedAt > since);
        const likes = [...this.store.likes.values()].filter((l) => l.updatedAt > since && (l.fromUserId === userId || l.toUserId === userId));
        const matches = [...this.store.matches.values()].filter((m) => m.updatedAt > since && (m.userId1 === userId || m.userId2 === userId));
        const userMatchIds = new Set([...this.store.matches.values()]
            .filter((m) => m.userId1 === userId || m.userId2 === userId)
            .map((m) => m.id));
        const messages = [...this.store.messages.values()].filter((msg) => msg.updatedAt > since && userMatchIds.has(msg.matchId));
        const spots = [...this.store.sharedSpots.values()].filter((s) => s.updatedAt > since && s.userId === userId);
        return {
            profiles: profiles.map((p) => ({
                id: p.id,
                user_id: p.userId,
                name: p.name,
                gender: p.gender,
                height_cm: p.heightCm,
                bio: p.bio,
                intention: p.intention,
                location: p.location,
                interests: JSON.parse(p.interestsJson),
                photos: JSON.parse(p.photosJson),
                is_face_verified: p.isFaceVerified,
                updated_at: p.updatedAt.toISOString(),
            })),
            likes: likes.map((l) => ({
                id: l.id,
                from_user_id: l.fromUserId,
                to_user_id: l.toUserId,
                super_like: l.superLike,
                updated_at: l.updatedAt.toISOString(),
            })),
            matches: matches.map((m) => ({
                id: m.id,
                user_id_1: m.userId1,
                user_id_2: m.userId2,
                matched_at: m.matchedAt.toISOString(),
                updated_at: m.updatedAt.toISOString(),
            })),
            messages: messages.map((msg) => ({
                id: msg.id,
                match_id: msg.matchId,
                sender_id: msg.senderId,
                text: msg.text,
                sent_at: msg.sentAt.toISOString(),
                read_at: msg.readAt?.toISOString() ?? null,
                updated_at: msg.updatedAt.toISOString(),
            })),
            shared_spots: spots.map((s) => ({
                id: s.id,
                user_id: s.userId,
                name: s.name,
                lat: s.lat,
                lng: s.lng,
                visited_at: s.visitedAt.toISOString(),
                updated_at: s.updatedAt.toISOString(),
            })),
            pulled_at: new Date().toISOString(),
        };
    }
};
exports.SyncService = SyncService;
exports.SyncService = SyncService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [store_service_1.StoreService])
], SyncService);
//# sourceMappingURL=sync.service.js.map