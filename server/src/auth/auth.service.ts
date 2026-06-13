import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import {
  StoreService,
  UserRecord,
  ProfileRecord,
  RefreshTokenRecord,
} from '../store/store.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  constructor(private readonly store: StoreService) {}

  // ─────────────────────────────────────────────────────────────────────────
  // JWT helpers
  // ─────────────────────────────────────────────────────────────────────────

  issueAccessToken(userId: string, email: string): string {
    return jwt.sign(
      { sub: userId, email, type: 'access' },
      process.env.JWT_SECRET ?? 'changeme_jwt_secret_32chars',
      { expiresIn: '1h', issuer: 'nearme' },
    );
  }

  private issueRefreshToken(userId: string): string {
    return jwt.sign(
      { sub: userId, type: 'refresh' },
      process.env.JWT_REFRESH_SECRET ?? 'changeme_refresh_secret_32chars',
      { expiresIn: '30d', issuer: 'nearme' },
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Email auth
  // ─────────────────────────────────────────────────────────────────────────

  async register(body: {
    name: string;
    email: string;
    password: string;
    gender?: string;
    heightCm?: number;
    bio?: string;
    intention?: string;
    location?: string;
    interests?: string[];
  }) {
    if (!body.email || !body.password || !body.name) {
      throw new BadRequestException('name, email and password are required');
    }
    if (this.store.usersByEmail.has(body.email.toLowerCase())) {
      throw new ConflictException('Email already in use');
    }

    const passwordHash = await bcrypt.hash(body.password, 12);
    const userId = uuidv4();
    const now = new Date();

    const user: UserRecord = {
      id: userId,
      email: body.email.toLowerCase(),
      passwordHash,
    };
    this.store.users.set(userId, user);
    this.store.usersByEmail.set(body.email.toLowerCase(), user);

    const profile: ProfileRecord = {
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

  async login(email: string, password: string) {
    // Message identique pour email inconnu et mot de passe incorrect
    // → empêche l'énumération d'utilisateurs
    const user = this.store.usersByEmail.get(email.toLowerCase());
    if (!user) throw new UnauthorizedException('Invalid credentials');

    // Un compte OAuth sans mot de passe ne peut pas se connecter par email
    if (!user.passwordHash) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    return this.buildTokenResponse(user.id, user.email);
  }

  async refresh(oldToken: string) {
    let payload: any;
    try {
      payload = jwt.verify(
        oldToken,
        process.env.JWT_REFRESH_SECRET ?? 'changeme_refresh_secret_32chars',
      );
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const stored = this.store.refreshTokens.get(oldToken);
    if (!stored || stored.revokedAt) {
      throw new UnauthorizedException('Token revoked');
    }
    if (stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Token expired');
    }

    // Rotation : invalider l'ancien token immédiatement
    stored.revokedAt = new Date();

    const user = this.store.users.get(payload.sub);
    if (!user) throw new UnauthorizedException('User not found');

    return this.buildTokenResponse(user.id, user.email);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Google OAuth
  //
  // Vérification via l'endpoint tokeninfo de Google (HTTPS, pas de clé privée
  // requise côté serveur). En production, préférer google-auth-library pour
  // une vérification locale avec les clés publiques mises en cache.
  // ─────────────────────────────────────────────────────────────────────────

  async loginWithGoogle(idToken: string) {
    if (!idToken) throw new BadRequestException('id_token is required');

    let googlePayload: { sub: string; email: string; name?: string; email_verified?: boolean };
    try {
      const { data } = await axios.get<any>(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
        { timeout: 10_000 },
      );

      if (!data.sub || !data.email) {
        throw new Error('Missing sub or email in Google payload');
      }

      // Vérifier l'audience si GOOGLE_CLIENT_ID est configuré
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
    } catch (err: any) {
      throw new UnauthorizedException(
        `Invalid Google token: ${err?.response?.data?.error_description ?? err.message}`,
      );
    }

    return this.findOrCreateOAuthUser({
      provider: 'google',
      sub:      googlePayload.sub,
      email:    googlePayload.email,
      name:     googlePayload.name,
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Apple Sign-In
  //
  // Vérification locale via les clés publiques Apple (JWKS) sans dépendance
  // externe — Node.js crypto supporte JWK nativement depuis Node 14.
  // ─────────────────────────────────────────────────────────────────────────

  async loginWithApple(identityToken: string, emailHint?: string, name?: string) {
    if (!identityToken) throw new BadRequestException('identity_token is required');

    let applePayload: { sub: string; email?: string };
    try {
      // 1. Décoder l'en-tête pour obtenir le kid
      const decoded = jwt.decode(identityToken, { complete: true });
      if (!decoded || typeof decoded === 'string') {
        throw new Error('Cannot decode Apple identity token');
      }
      const kid = (decoded.header as any).kid as string;

      // 2. Récupérer les clés publiques Apple
      const { data } = await axios.get<{ keys: any[] }>(
        'https://appleid.apple.com/auth/keys',
        { timeout: 10_000 },
      );

      const jwk = data.keys.find((k) => k.kid === kid);
      if (!jwk) throw new Error(`Apple public key not found for kid=${kid}`);

      // 3. Convertir JWK → PEM via crypto natif Node.js (≥ 14)
      const pubKey = crypto.createPublicKey({ key: jwk, format: 'jwk' });
      const pem = pubKey.export({ type: 'spki', format: 'pem' }) as string;

      // 4. Vérifier la signature JWT
      const verifyOptions: jwt.VerifyOptions = {
        algorithms: ['RS256'],
        issuer: 'https://appleid.apple.com',
      };
      const clientId = process.env.APPLE_CLIENT_ID;
      if (clientId) verifyOptions.audience = clientId;

      const payload = jwt.verify(identityToken, pem, verifyOptions) as any;
      applePayload = { sub: payload.sub, email: payload.email };
    } catch (err: any) {
      throw new UnauthorizedException(`Invalid Apple token: ${err.message}`);
    }

    // Apple ne retourne l'email que lors de la première connexion.
    // On accepte l'email fourni par le client comme fallback.
    const email = applePayload.email ?? emailHint;
    if (!email) {
      throw new BadRequestException(
        'Email is required for first-time Apple sign-in',
      );
    }

    return this.findOrCreateOAuthUser({
      provider: 'apple',
      sub:      applePayload.sub,
      email:    email.toLowerCase(),
      name,
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Forgot password (stub — envoi d'email à implémenter avec NodeMailer/SES)
  // ─────────────────────────────────────────────────────────────────────────

  async forgotPassword(email: string) {
    if (!email) throw new BadRequestException('email is required');
    // On ne révèle pas si l'email existe ou non
    const user = this.store.usersByEmail.get(email.toLowerCase());
    if (user) {
      // TODO: générer un token de reset, l'enregistrer, envoyer l'email
      console.log(`[auth] forgot-password requested for ${email}`);
    }
    return { message: 'If that email exists, a reset link has been sent.' };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Helpers privés
  // ─────────────────────────────────────────────────────────────────────────

  /** Trouve un compte OAuth existant, ou en crée un nouveau. */
  private findOrCreateOAuthUser(opts: {
    provider: 'google' | 'apple';
    sub: string;
    email: string;
    name?: string;
  }) {
    const oauthKey = `${opts.provider}:${opts.sub}`;

    // 1. Chercher par clé OAuth (reconnexion)
    let user = this.store.usersByOAuth.get(oauthKey);

    // 2. Sinon chercher par email (compte email existant → liaison)
    if (!user) user = this.store.usersByEmail.get(opts.email);

    // 3. Créer un nouveau compte
    if (!user) {
      const userId = uuidv4();
      user = {
        id: userId,
        email: opts.email,
        passwordHash: '',      // pas de mot de passe pour les comptes OAuth
        oauthProvider: opts.provider,
        oauthSub: opts.sub,
      };
      this.store.users.set(userId, user);
      this.store.usersByEmail.set(opts.email, user);

      const profile: ProfileRecord = {
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

    // Enregistrer/mettre à jour la clé OAuth
    this.store.usersByOAuth.set(oauthKey, user);

    return this.buildTokenResponse(user.id, user.email);
  }

  private buildTokenResponse(userId: string, email: string) {
    const accessToken  = this.issueAccessToken(userId, email);
    const refreshToken = this.issueRefreshToken(userId);

    const tokenRecord: RefreshTokenRecord = {
      id:        uuidv4(),
      userId,
      token:     refreshToken,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    };
    this.store.refreshTokens.set(refreshToken, tokenRecord);

    const profile = this.store.profiles.get(userId);

    return {
      user_id:       userId,
      email,
      access_token:  accessToken,
      refresh_token: refreshToken,
      profile:       profile ? this.serializeProfile(profile) : null,
    };
  }

  serializeProfile(p: ProfileRecord) {
    return {
      id:              p.id,
      user_id:         p.userId,
      name:            p.name,
      gender:          p.gender,
      height_cm:       p.heightCm,
      bio:             p.bio,
      intention:       p.intention,
      location:        p.location,
      interests:       JSON.parse(p.interestsJson),
      photos:          JSON.parse(p.photosJson),
      is_face_verified: p.isFaceVerified,
      updated_at:      p.updatedAt.toISOString(),
    };
  }
}
