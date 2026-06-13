export interface UserRecord {
    id: string;
    email: string;
    passwordHash: string;
    oauthProvider?: 'google' | 'apple' | null;
    oauthSub?: string | null;
}
export interface ProfileRecord {
    id: string;
    userId: string;
    name: string;
    gender?: string | null;
    heightCm?: number | null;
    bio?: string | null;
    intention?: string | null;
    location?: string | null;
    interestsJson: string;
    photosJson: string;
    isFaceVerified: boolean;
    updatedAt: Date;
}
export interface RefreshTokenRecord {
    id: string;
    userId: string;
    token: string;
    expiresAt: Date;
    revokedAt?: Date | null;
}
export interface LikeRecord {
    id: string;
    fromUserId: string;
    toUserId: string;
    superLike: boolean;
    updatedAt: Date;
}
export interface MatchRecord {
    id: string;
    userId1: string;
    userId2: string;
    matchedAt: Date;
    updatedAt: Date;
}
export interface MessageRecord {
    id: string;
    matchId: string;
    senderId: string;
    text: string;
    sentAt: Date;
    readAt?: Date | null;
    updatedAt: Date;
}
export interface SharedSpotRecord {
    id: string;
    userId: string;
    name: string;
    lat?: number | null;
    lng?: number | null;
    visitedAt: Date;
    updatedAt: Date;
}
export declare class StoreService {
    readonly users: Map<string, UserRecord>;
    readonly usersByEmail: Map<string, UserRecord>;
    readonly usersByOAuth: Map<string, UserRecord>;
    readonly profiles: Map<string, ProfileRecord>;
    readonly refreshTokens: Map<string, RefreshTokenRecord>;
    readonly likes: Map<string, LikeRecord>;
    readonly matches: Map<string, MatchRecord>;
    readonly messages: Map<string, MessageRecord>;
    readonly sharedSpots: Map<string, SharedSpotRecord>;
}
