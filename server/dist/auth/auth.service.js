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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const store_service_1 = require("../store/store.service");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const axios_1 = require("axios");
const uuid_1 = require("uuid");
let AuthService = class AuthService {
    constructor(store) {
        this.store = store;
    }
    issueAccessToken(userId, email) {
        return jwt.sign({ sub: userId, email, type: 'access' }, process.env.JWT_SECRET ?? 'changeme_jwt_secret_32chars', { expiresIn: '1h', issuer: 'nearme' });
    }
    issueRefreshToken(userId) {
        return jwt.sign({ sub: userId, type: 'refresh' }, process.env.JWT_REFRESH_SECRET ?? 'changeme_refresh_secret_32chars', { expiresIn: '30d', issuer: 'nearme' });
    }
    async register(body) {
        if (!body.email || !body.password || !body.name) {
            throw new common_1.BadRequestException('name, email and password are required');
        }
        if (this.store.usersByEmail.has(body.email.toLowerCase())) {
            throw new common_1.ConflictException('Email already in use');
        }
        const passwordHash = await bcrypt.hash(body.password, 12);
        const userId = (0, uuid_1.v4)();
        const now = new Date();
        const user = {
            id: userId,
            email: body.email.toLowerCase(),
            passwordHash,
        };
        this.store.users.set(userId, user);
        this.store.usersByEmail.set(body.email.toLowerCase(), user);
        const profile = {
            id: userId,
            userId,
            name: body.name,
            gender: body.gender ?? null,
            heightCm: body.heightCm ?? null,
            bio: body.bio ?? null,
            intention: body.intention ?? null,
            location: body.location ?? null,
            interestsJson: JSON.stringify(body.interests ?? []),
            photosJson: '[]',
            isFaceVerified: false,
            updatedAt: now,
        };
        this.store.profiles.set(userId, profile);
        return this.buildTokenResponse(userId, user.email);
    }
    async login(email, password) {
        const user = this.store.usersByEmail.get(email.toLowerCase());
        if (!user)
            throw new common_1.UnauthorizedException('Invalid credentials');
        if (!user.passwordHash)
            throw new common_1.UnauthorizedException('Invalid credentials');
        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid)
            throw new common_1.UnauthorizedException('Invalid credentials');
        return this.buildTokenResponse(user.id, user.email);
    }
    async refresh(oldToken) {
        let payload;
        try {
            payload = jwt.verify(oldToken, process.env.JWT_REFRESH_SECRET ?? 'changeme_refresh_secret_32chars');
        }
        catch {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
        const stored = this.store.refreshTokens.get(oldToken);
        if (!stored || stored.revokedAt) {
            throw new common_1.UnauthorizedException('Token revoked');
        }
        if (stored.expiresAt < new Date()) {
            throw new common_1.UnauthorizedException('Token expired');
        }
        stored.revokedAt = new Date();
        const user = this.store.users.get(payload.sub);
        if (!user)
            throw new common_1.UnauthorizedException('User not found');
        return this.buildTokenResponse(user.id, user.email);
    }
    async loginWithGoogle(idToken) {
        if (!idToken)
            throw new common_1.BadRequestException('id_token is required');
        let googlePayload;
        try {
            const { data } = await axios_1.default.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`, { timeout: 10_000 });
            if (!data.sub || !data.email) {
                throw new Error('Missing sub or email in Google payload');
            }
            const clientId = process.env.GOOGLE_CLIENT_ID;
            if (clientId && data.aud !== clientId) {
                throw new Error('Google token audience mismatch');
            }
            googlePayload = {
                sub: data.sub,
                email: data.email.toLowerCase(),
                name: data.name,
                email_verified: data.email_verified === 'true',
            };
        }
        catch (err) {
            throw new common_1.UnauthorizedException(`Invalid Google token: ${err?.response?.data?.error_description ?? err.message}`);
        }
        return this.findOrCreateOAuthUser({
            provider: 'google',
            sub: googlePayload.sub,
            email: googlePayload.email,
            name: googlePayload.name,
        });
    }
    async loginWithApple(identityToken, emailHint, name) {
        if (!identityToken)
            throw new common_1.BadRequestException('identity_token is required');
        let applePayload;
        try {
            const decoded = jwt.decode(identityToken, { complete: true });
            if (!decoded || typeof decoded === 'string') {
                throw new Error('Cannot decode Apple identity token');
            }
            const kid = decoded.header.kid;
            const { data } = await axios_1.default.get('https://appleid.apple.com/auth/keys', { timeout: 10_000 });
            const jwk = data.keys.find((k) => k.kid === kid);
            if (!jwk)
                throw new Error(`Apple public key not found for kid=${kid}`);
            const pubKey = crypto.createPublicKey({ key: jwk, format: 'jwk' });
            const pem = pubKey.export({ type: 'spki', format: 'pem' });
            const verifyOptions = {
                algorithms: ['RS256'],
                issuer: 'https://appleid.apple.com',
            };
            const clientId = process.env.APPLE_CLIENT_ID;
            if (clientId)
                verifyOptions.audience = clientId;
            const payload = jwt.verify(identityToken, pem, verifyOptions);
            applePayload = { sub: payload.sub, email: payload.email };
        }
        catch (err) {
            throw new common_1.UnauthorizedException(`Invalid Apple token: ${err.message}`);
        }
        const email = applePayload.email ?? emailHint;
        if (!email) {
            throw new common_1.BadRequestException('Email is required for first-time Apple sign-in');
        }
        return this.findOrCreateOAuthUser({
            provider: 'apple',
            sub: applePayload.sub,
            email: email.toLowerCase(),
            name,
        });
    }
    async forgotPassword(email) {
        if (!email)
            throw new common_1.BadRequestException('email is required');
        const user = this.store.usersByEmail.get(email.toLowerCase());
        if (user) {
            console.log(`[auth] forgot-password requested for ${email}`);
        }
        return { message: 'If that email exists, a reset link has been sent.' };
    }
    findOrCreateOAuthUser(opts) {
        const oauthKey = `${opts.provider}:${opts.sub}`;
        let user = this.store.usersByOAuth.get(oauthKey);
        if (!user)
            user = this.store.usersByEmail.get(opts.email);
        if (!user) {
            const userId = (0, uuid_1.v4)();
            user = {
                id: userId,
                email: opts.email,
                passwordHash: '',
                oauthProvider: opts.provider,
                oauthSub: opts.sub,
            };
            this.store.users.set(userId, user);
            this.store.usersByEmail.set(opts.email, user);
            const profile = {
                id: userId,
                userId,
                name: opts.name ?? opts.email.split('@')[0],
                gender: null,
                heightCm: null,
                bio: null,
                intention: null,
                location: null,
                interestsJson: '[]',
                photosJson: '[]',
                isFaceVerified: false,
                updatedAt: new Date(),
            };
            this.store.profiles.set(userId, profile);
        }
        this.store.usersByOAuth.set(oauthKey, user);
        return this.buildTokenResponse(user.id, user.email);
    }
    buildTokenResponse(userId, email) {
        const accessToken = this.issueAccessToken(userId, email);
        const refreshToken = this.issueRefreshToken(userId);
        const tokenRecord = {
            id: (0, uuid_1.v4)(),
            userId,
            token: refreshToken,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        };
        this.store.refreshTokens.set(refreshToken, tokenRecord);
        const profile = this.store.profiles.get(userId);
        return {
            user_id: userId,
            email,
            access_token: accessToken,
            refresh_token: refreshToken,
            profile: profile ? this.serializeProfile(profile) : null,
        };
    }
    serializeProfile(p) {
        return {
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
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [store_service_1.StoreService])
], AuthService);
//# sourceMappingURL=auth.service.js.map