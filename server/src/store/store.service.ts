import { Injectable } from '@nestjs/common';

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;         // vide '' pour les utilisateurs OAuth
  oauthProvider?: 'google' | 'apple' | null;
  oauthSub?: string | null;     // sub Google ou sub Apple
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

@Injectable()
export class StoreService {
  readonly users          = new Map<string, UserRecord>();
  readonly usersByEmail   = new Map<string, UserRecord>();
  readonly usersByOAuth   = new Map<string, UserRecord>();         // 'google:sub' | 'apple:sub' → user
  readonly profiles       = new Map<string, ProfileRecord>();      // userId → profile
  readonly refreshTokens  = new Map<string, RefreshTokenRecord>(); // token string → record
  readonly likes          = new Map<string, LikeRecord>();         // id → like
  readonly matches        = new Map<string, MatchRecord>();        // id → match
  readonly messages       = new Map<string, MessageRecord>();      // id → message
  readonly sharedSpots    = new Map<string, SharedSpotRecord>();   // id → spot
}
