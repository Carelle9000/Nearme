import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';
import axios from 'axios';
import { AuthService } from './auth.service';
import { StoreService } from '../store/store.service';

jest.mock('axios');
jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let store: StoreService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService, StoreService],
    }).compile();

    service = module.get<AuthService>(AuthService);
    store = module.get<StoreService>(StoreService);

    // Réinitialiser les Maps avant chaque test
    store.users.clear();
    store.usersByEmail.clear();
    store.usersByOAuth.clear();
    store.profiles.clear();
    store.refreshTokens.clear();

    // Mock des variables d'environnement
    process.env.JWT_SECRET = 'test_jwt_secret_32_chars_long_enough';
    process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_32chars_long_enough';
    process.env.GOOGLE_CLIENT_ID = 'test-google-client-id.apps.googleusercontent.com';
    process.env.APPLE_CLIENT_ID = 'com.nearme.app';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const result = await service.register({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'securePassword123',
        gender: 'male',
        heightCm: 180,
        bio: 'Looking for fun',
        intention: 'dating',
        location: 'Paris',
        interests: ['travel', 'music'],
      });

      expect(result).toHaveProperty('user_id');
      expect(result).toHaveProperty('email', 'john@example.com');
      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
      expect(result).toHaveProperty('profile');
      expect(result.profile!.name).toBe('John Doe');
      expect(result.profile!.gender).toBe('male');
      expect(result.profile!.is_face_verified).toBe(false);

      // Vérifier que l'utilisateur est enregistré en base
      expect(store.users.size).toBe(1);
      expect(store.usersByEmail.has('john@example.com')).toBe(true);
    });

    it('should lowercase the email', async () => {
      await service.register({
        name: 'Jane Doe',
        email: 'JANE@EXAMPLE.COM',
        password: 'securePassword123',
      });

      expect(store.usersByEmail.has('jane@example.com')).toBe(true);
    });

    it('should throw ConflictException if email already exists', async () => {
      // Enregistrer le premier utilisateur
      await service.register({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password1',
      });

      // Tentative d'enregistrement avec le même email
      await expect(
        service.register({
          name: 'Jane Doe',
          email: 'john@example.com',
          password: 'password2',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException if name is missing', async () => {
      await expect(
        service.register({
          name: '',
          email: 'john@example.com',
          password: 'password',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if email is missing', async () => {
      await expect(
        service.register({
          name: 'John Doe',
          email: '',
          password: 'password',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if password is missing', async () => {
      await expect(
        service.register({
          name: 'John Doe',
          email: 'john@example.com',
          password: '',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle optional profile fields', async () => {
      const result = await service.register({
        name: 'Minimal User',
        email: 'minimal@example.com',
        password: 'password',
      });

      expect(result.profile!.gender).toBeNull();
      expect(result.profile!.height_cm).toBeNull();
      expect(result.profile!.bio).toBeNull();
      expect(result.profile!.interests).toEqual([]);
    });

    it('should set isFaceVerified to false', async () => {
      const result = await service.register({
        name: 'Face Test',
        email: 'face@example.com',
        password: 'password',
      });

      expect(result.profile!.is_face_verified).toBe(false);
    });

    it('should create refresh token in store', async () => {
      const result = await service.register({
        name: 'Token Test',
        email: 'token@example.com',
        password: 'password',
      });

      expect(store.refreshTokens.has(result.refresh_token)).toBe(true);
      const tokenRecord = store.refreshTokens.get(result.refresh_token);
      expect(tokenRecord?.userId).toBe(result.user_id);
      expect(tokenRecord?.revokedAt).toBeUndefined();
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      // Créer un utilisateur pour les tests de login
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
      await service.register({
        name: 'Login Test',
        email: 'login@example.com',
        password: 'correctPassword',
      });
      jest.clearAllMocks();
    });

    it('should login successfully with correct credentials', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login('login@example.com', 'correctPassword');

      expect(result).toHaveProperty('user_id');
      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
      expect(result.email).toBe('login@example.com');
    });

    it('should throw UnauthorizedException if email does not exist', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(
        service.login('nonexistent@example.com', 'password'),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        service.login('nonexistent@example.com', 'password'),
      ).rejects.toThrow('Invalid credentials');
    });

    it('should throw UnauthorizedException if password is incorrect', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login('login@example.com', 'wrongPassword'),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        service.login('login@example.com', 'wrongPassword'),
      ).rejects.toThrow('Invalid credentials');
    });

    it('should lowercase the email', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login('LOGIN@EXAMPLE.COM', 'correctPassword');

      expect(result.email).toBe('login@example.com');
    });

    it('should throw UnauthorizedException if user has no password (OAuth user)', async () => {
      // Créer un utilisateur OAuth sans mot de passe
      const user = {
        id: 'oauth-user-id',
        email: 'oauth@example.com',
        passwordHash: '', // pas de mot de passe
        oauthProvider: 'google' as const,
        oauthSub: 'google-sub',
      };
      store.users.set(user.id, user);
      store.usersByEmail.set(user.email, user);

      await expect(
        service.login('oauth@example.com', 'anyPassword'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should use same error message for email not found and wrong password', async () => {
      // Vérifier que les deux cas retournent le même message
      // (protection contre l'énumération d'utilisateurs)
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const emailNotFoundError = await service
        .login('nonexistent@example.com', 'password')
        .catch((e) => e);
      const wrongPasswordError = await service
        .login('login@example.com', 'wrongPassword')
        .catch((e) => e);

      expect(emailNotFoundError.message).toBe('Invalid credentials');
      expect(wrongPasswordError.message).toBe('Invalid credentials');
    });
  });

  describe('refresh', () => {
    let userId: string;
    let refreshToken: string;

    beforeEach(async () => {
      // Créer un utilisateur et obtenir le refresh token
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
      const result = await service.register({
        name: 'Refresh Test',
        email: 'refresh@example.com',
        password: 'password',
      });
      userId = result.user_id;
      refreshToken = result.refresh_token;
      jest.clearAllMocks();
    });

    it('should refresh tokens successfully', async () => {
      const result = await service.refresh(refreshToken);

      expect(result).toHaveProperty('user_id', userId);
      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
      expect(result.refresh_token).not.toBe(refreshToken); // Nouveau token
    });

    it('should rotate the refresh token (revoke old one)', async () => {
      const oldToken = store.refreshTokens.get(refreshToken)!;
      expect(oldToken.revokedAt).toBeUndefined();

      await service.refresh(refreshToken);

      expect(oldToken.revokedAt).toBeDefined();
    });

    it('should throw UnauthorizedException if token is invalid JWT', async () => {
      const invalidToken = 'not.a.valid.jwt';

      await expect(service.refresh(invalidToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if token is revoked', async () => {
      // Révoquer le token
      const tokenRecord = store.refreshTokens.get(refreshToken)!;
      tokenRecord.revokedAt = new Date();

      await expect(service.refresh(refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.refresh(refreshToken)).rejects.toThrow(
        'Token revoked',
      );
    });

    it('should throw UnauthorizedException if token is expired', async () => {
      // Marquer le token comme expiré
      const tokenRecord = store.refreshTokens.get(refreshToken)!;
      tokenRecord.expiresAt = new Date(Date.now() - 1000); // 1 seconde dans le passé

      await expect(service.refresh(refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.refresh(refreshToken)).rejects.toThrow(
        'Token expired',
      );
    });

    it('should throw UnauthorizedException if user not found', async () => {
      // Créer un token pour un utilisateur inexistant
      const fakeToken = jwt.sign(
        { sub: 'nonexistent-user-id', type: 'refresh' },
        process.env.JWT_REFRESH_SECRET!,
        { expiresIn: '30d' },
      );

      const tokenRecord = {
        id: 'fake-token-id',
        userId: 'nonexistent-user-id',
        token: fakeToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      };
      store.refreshTokens.set(fakeToken, tokenRecord);

      await expect(service.refresh(fakeToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should issue new access and refresh tokens', async () => {
      const result = await service.refresh(refreshToken);
      const newAccessToken = result.access_token;
      const newRefreshToken = result.refresh_token;

      // Décoder et vérifier les tokens
      const accessPayload = jwt.verify(
        newAccessToken,
        process.env.JWT_SECRET!,
      ) as any;
      expect(accessPayload.sub).toBe(userId);
      expect(accessPayload.type).toBe('access');

      const refreshPayload = jwt.verify(
        newRefreshToken,
        process.env.JWT_REFRESH_SECRET!,
      ) as any;
      expect(refreshPayload.sub).toBe(userId);
      expect(refreshPayload.type).toBe('refresh');
    });
  });

  describe('loginWithGoogle', () => {
    const validGoogleToken = jwt.sign(
      {
        sub: 'google-user-123',
        email: 'google@example.com',
        name: 'Google User',
        email_verified: 'true',
        aud: 'test-google-client-id.apps.googleusercontent.com',
      },
      'google-secret', // simulation
      { issuer: 'accounts.google.com' },
    );

    it('should login with valid Google token', async () => {
      (axios.get as jest.Mock).mockResolvedValue({
        data: {
          sub: 'google-user-123',
          email: 'google@example.com',
          name: 'Google User',
          email_verified: 'true',
          aud: 'test-google-client-id.apps.googleusercontent.com',
        },
      });

      const result = await service.loginWithGoogle(validGoogleToken);

      expect(result).toHaveProperty('user_id');
      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
      expect(result.email).toBe('google@example.com');
    });

    it('should lowercase the email', async () => {
      (axios.get as jest.Mock).mockResolvedValue({
        data: {
          sub: 'google-user-456',
          email: 'GOOGLE@EXAMPLE.COM',
          name: 'Google User',
          email_verified: 'true',
          aud: 'test-google-client-id.apps.googleusercontent.com',
        },
      });

      const result = await service.loginWithGoogle(validGoogleToken);

      expect(result.email).toBe('google@example.com');
    });

    it('should throw BadRequestException if id_token is missing', async () => {
      await expect(service.loginWithGoogle('')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw UnauthorizedException if Google token is invalid', async () => {
      (axios.get as jest.Mock).mockRejectedValue(
        new Error('Invalid token format'),
      );

      await expect(service.loginWithGoogle(validGoogleToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if Google API returns error', async () => {
      (axios.get as jest.Mock).mockResolvedValue({
        data: { error_description: 'Invalid audience' },
      });

      await expect(service.loginWithGoogle(validGoogleToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if sub or email is missing', async () => {
      (axios.get as jest.Mock).mockResolvedValue({
        data: {
          email: 'google@example.com',
          // sub is missing
          aud: 'test-google-client-id.apps.googleusercontent.com',
        },
      });

      await expect(service.loginWithGoogle(validGoogleToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException on audience mismatch', async () => {
      (axios.get as jest.Mock).mockResolvedValue({
        data: {
          sub: 'google-user-789',
          email: 'google@example.com',
          name: 'Google User',
          email_verified: 'true',
          aud: 'wrong-client-id.apps.googleusercontent.com',
        },
      });

      await expect(service.loginWithGoogle(validGoogleToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should create new user if not exists', async () => {
      (axios.get as jest.Mock).mockResolvedValue({
        data: {
          sub: 'google-new-user',
          email: 'newgoogle@example.com',
          name: 'New Google User',
          email_verified: 'true',
          aud: 'test-google-client-id.apps.googleusercontent.com',
        },
      });

      const result = await service.loginWithGoogle(validGoogleToken);

      expect(store.users.size).toBe(1);
      expect(store.usersByEmail.has('newgoogle@example.com')).toBe(true);
      expect(store.usersByOAuth.has('google:google-new-user')).toBe(true);
    });

    it('should find existing user by OAuth key', async () => {
      (axios.get as jest.Mock).mockResolvedValue({
        data: {
          sub: 'google-existing-user',
          email: 'existing@example.com',
          name: 'Existing Google User',
          email_verified: 'true',
          aud: 'test-google-client-id.apps.googleusercontent.com',
        },
      });

      // Première connexion
      const result1 = await service.loginWithGoogle(validGoogleToken);
      const userId = result1.user_id;

      // Deuxième connexion avec le même sub
      const result2 = await service.loginWithGoogle(validGoogleToken);

      expect(result2.user_id).toBe(userId);
      expect(store.users.size).toBe(1); // Pas de nouvel utilisateur créé
    });

    it('should link to existing email account', async () => {
      // Créer un utilisateur par email
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
      await service.register({
        name: 'Existing User',
        email: 'existing@example.com',
        password: 'password',
      });

      jest.clearAllMocks();

      // Connexion Google avec le même email
      (axios.get as jest.Mock).mockResolvedValue({
        data: {
          sub: 'google-user-link',
          email: 'existing@example.com',
          name: 'Google User',
          email_verified: 'true',
          aud: 'test-google-client-id.apps.googleusercontent.com',
        },
      });

      const result = await service.loginWithGoogle(validGoogleToken);

      expect(store.users.size).toBe(1); // Pas de nouvel utilisateur
      expect(store.usersByOAuth.has('google:google-user-link')).toBe(true);
    });

    it('should skip GOOGLE_CLIENT_ID check if not configured', async () => {
      const originalClientId = process.env.GOOGLE_CLIENT_ID;
      delete process.env.GOOGLE_CLIENT_ID;

      (axios.get as jest.Mock).mockResolvedValue({
        data: {
          sub: 'google-user-no-aud-check',
          email: 'noardcheck@example.com',
          name: 'No Aud Check',
          email_verified: 'true',
          aud: 'any-client-id', // Ne sera pas vérifié
        },
      });

      const result = await service.loginWithGoogle(validGoogleToken);

      expect(result).toHaveProperty('user_id');

      process.env.GOOGLE_CLIENT_ID = originalClientId;
    });
  });

  describe('loginWithApple', () => {
    const validAppleToken = jwt.sign(
      {
        sub: 'apple-user-123',
        email: 'apple@example.com',
        iss: 'https://appleid.apple.com',
      },
      'apple-secret',
      { algorithm: 'RS256', issuer: 'https://appleid.apple.com' },
    );

    beforeEach(() => {
      // Mock pour apple keyid
      jest.spyOn(jwt, 'decode').mockReturnValue({
        header: { kid: 'test-key-id' },
        payload: {
          sub: 'apple-user-123',
          email: 'apple@example.com',
        },
      } as any);
    });

    it('should login with valid Apple token', async () => {
      (axios.get as jest.Mock).mockResolvedValue({
        data: {
          keys: [
            {
              kid: 'test-key-id',
              kty: 'RSA',
              n: 'test-n',
              e: 'AQAB',
            },
          ],
        },
      });

      jest.spyOn(jwt, 'verify').mockReturnValue({
        sub: 'apple-user-123',
        email: 'apple@example.com',
        iss: 'https://appleid.apple.com',
      } as any);

      const result = await service.loginWithApple(validAppleToken);

      expect(result).toHaveProperty('user_id');
      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
      expect(result.email).toBe('apple@example.com');
    });

    it('should throw BadRequestException if identity_token is missing', async () => {
      await expect(service.loginWithApple('')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw UnauthorizedException if token cannot be decoded', async () => {
      jest.spyOn(jwt, 'decode').mockReturnValue(null);

      await expect(service.loginWithApple(validAppleToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if Apple key not found', async () => {
      (axios.get as jest.Mock).mockResolvedValue({
        data: {
          keys: [
            {
              kid: 'different-key-id',
              kty: 'RSA',
              n: 'test-n',
              e: 'AQAB',
            },
          ],
        },
      });

      await expect(service.loginWithApple(validAppleToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if JWT verification fails', async () => {
      (axios.get as jest.Mock).mockResolvedValue({
        data: {
          keys: [
            {
              kid: 'test-key-id',
              kty: 'RSA',
              n: 'test-n',
              e: 'AQAB',
            },
          ],
        },
      });

      jest.spyOn(jwt, 'verify').mockImplementation(() => {
        throw new Error('Signature verification failed');
      });

      await expect(service.loginWithApple(validAppleToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should accept emailHint if email not in token', async () => {
      (axios.get as jest.Mock).mockResolvedValue({
        data: {
          keys: [
            {
              kid: 'test-key-id',
              kty: 'RSA',
              n: 'test-n',
              e: 'AQAB',
            },
          ],
        },
      });

      jest.spyOn(jwt, 'verify').mockReturnValue({
        sub: 'apple-user-no-email',
        // email is missing
        iss: 'https://appleid.apple.com',
      } as any);

      const result = await service.loginWithApple(
        validAppleToken,
        'hinted@example.com',
      );

      expect(result.email).toBe('hinted@example.com');
    });

    it('should throw BadRequestException if email missing and no emailHint', async () => {
      (axios.get as jest.Mock).mockResolvedValue({
        data: {
          keys: [
            {
              kid: 'test-key-id',
              kty: 'RSA',
              n: 'test-n',
              e: 'AQAB',
            },
          ],
        },
      });

      jest.spyOn(jwt, 'verify').mockReturnValue({
        sub: 'apple-user-no-email',
        // email is missing
        iss: 'https://appleid.apple.com',
      } as any);

      await expect(service.loginWithApple(validAppleToken)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should accept name parameter for new account', async () => {
      (axios.get as jest.Mock).mockResolvedValue({
        data: {
          keys: [
            {
              kid: 'test-key-id',
              kty: 'RSA',
              n: 'test-n',
              e: 'AQAB',
            },
          ],
        },
      });

      jest.spyOn(jwt, 'verify').mockReturnValue({
        sub: 'apple-user-with-name',
        email: 'apple2@example.com',
        iss: 'https://appleid.apple.com',
      } as any);

      const result = await service.loginWithApple(
        validAppleToken,
        undefined,
        'Custom Name',
      );

      const profile = store.profiles.get(result.user_id);
      expect(profile?.name).toBe('Custom Name');
    });

    it('should lowercase the email', async () => {
      (axios.get as jest.Mock).mockResolvedValue({
        data: {
          keys: [
            {
              kid: 'test-key-id',
              kty: 'RSA',
              n: 'test-n',
              e: 'AQAB',
            },
          ],
        },
      });

      jest.spyOn(jwt, 'verify').mockReturnValue({
        sub: 'apple-user-case',
        email: 'APPLE@EXAMPLE.COM',
        iss: 'https://appleid.apple.com',
      } as any);

      const result = await service.loginWithApple(validAppleToken);

      expect(result.email).toBe('apple@example.com');
    });

    it('should verify Apple token with APPLE_CLIENT_ID if configured', async () => {
      (axios.get as jest.Mock).mockResolvedValue({
        data: {
          keys: [
            {
              kid: 'test-key-id',
              kty: 'RSA',
              n: 'test-n',
              e: 'AQAB',
            },
          ],
        },
      });

      const verifySpy = jest.spyOn(jwt, 'verify');
      verifySpy.mockReturnValue({
        sub: 'apple-user-aud',
        email: 'appleaud@example.com',
        iss: 'https://appleid.apple.com',
      } as any);

      await service.loginWithApple(validAppleToken);

      expect(verifySpy).toHaveBeenCalledWith(
        validAppleToken,
        expect.any(String),
        expect.objectContaining({
          audience: 'com.nearme.app',
        }),
      );
    });

    it('should skip APPLE_CLIENT_ID check if not configured', async () => {
      const originalClientId = process.env.APPLE_CLIENT_ID;
      delete process.env.APPLE_CLIENT_ID;

      (axios.get as jest.Mock).mockResolvedValue({
        data: {
          keys: [
            {
              kid: 'test-key-id',
              kty: 'RSA',
              n: 'test-n',
              e: 'AQAB',
            },
          ],
        },
      });

      const verifySpy = jest.spyOn(jwt, 'verify');
      verifySpy.mockReturnValue({
        sub: 'apple-user-no-aud-check',
        email: 'applenoaud@example.com',
        iss: 'https://appleid.apple.com',
      } as any);

      await service.loginWithApple(validAppleToken);

      expect(verifySpy).toHaveBeenCalledWith(
        validAppleToken,
        expect.any(String),
        expect.not.objectContaining({
          audience: expect.anything(),
        }),
      );

      process.env.APPLE_CLIENT_ID = originalClientId;
    });
  });

  describe('forgotPassword', () => {
    beforeEach(async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
      await service.register({
        name: 'Password Reset Test',
        email: 'reset@example.com',
        password: 'oldPassword',
      });
      jest.clearAllMocks();
    });

    it('should return success message for existing email', async () => {
      const result = await service.forgotPassword('reset@example.com');

      expect(result).toHaveProperty('message');
      expect(result.message).toContain('reset link has been sent');
    });

    it('should return success message for nonexistent email', async () => {
      const result = await service.forgotPassword(
        'nonexistent@example.com',
      );

      expect(result).toHaveProperty('message');
      expect(result.message).toContain('reset link has been sent');
    });

    it('should not reveal if email exists or not', async () => {
      const resultExisting = await service.forgotPassword('reset@example.com');
      const resultNonExisting = await service.forgotPassword(
        'nonexistent@example.com',
      );

      expect(resultExisting.message).toBe(resultNonExisting.message);
    });

    it('should throw BadRequestException if email is empty', async () => {
      await expect(service.forgotPassword('')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should lowercase the email when checking', async () => {
      const result = await service.forgotPassword('RESET@EXAMPLE.COM');

      expect(result).toHaveProperty('message');
      // Ne devrait pas échouer
      expect(result.message).toContain('reset link has been sent');
    });
  });

  describe('JWT token generation', () => {
    it('should issue access token with correct payload', () => {
      const token = service.issueAccessToken('user-123', 'user@example.com');
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as any;

      expect(payload.sub).toBe('user-123');
      expect(payload.email).toBe('user@example.com');
      expect(payload.type).toBe('access');
      expect(payload.iss).toBe('nearme');
    });

    it('should issue refresh token with correct payload', () => {
      // Utiliser la méthode privée via une instance réelle
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
      service.register({
        name: 'Token Test',
        email: 'tokens@example.com',
        password: 'password',
      });

      // Le refresh token est créé dans buildTokenResponse
      // On extrait le payload via le store
      const firstUser = Array.from(store.users.values())[0];
      const refreshTokenEntry = Array.from(store.refreshTokens.values())[0];

      const payload = jwt.verify(
        refreshTokenEntry.token,
        process.env.JWT_REFRESH_SECRET!,
      ) as any;

      expect(payload.sub).toBe(firstUser.id);
      expect(payload.type).toBe('refresh');
      expect(payload.iss).toBe('nearme');
    });

    it('should use default secret if JWT_SECRET not set', () => {
      delete process.env.JWT_SECRET;

      const token = service.issueAccessToken('user-456', 'user@example.com');
      // Ne devrait pas échouer
      expect(token).toBeDefined();
    });
  });

  describe('serializeProfile', () => {
    it('should serialize profile correctly', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
      const result = await service.register({
        name: 'Serialize Test',
        email: 'serialize@example.com',
        password: 'password',
        gender: 'female',
        heightCm: 165,
        bio: 'Test bio',
        intention: 'relationship',
        location: 'Lyon',
        interests: ['reading', 'hiking'],
      });

      expect(result.profile).toEqual({
        id: result.profile!.id,
        user_id: result.user_id,
        name: 'Serialize Test',
        gender: 'female',
        height_cm: 165,
        bio: 'Test bio',
        intention: 'relationship',
        location: 'Lyon',
        interests: ['reading', 'hiking'],
        photos: [],
        is_face_verified: false,
        updated_at: expect.any(String),
      });
    });
  });

  describe('Edge cases and limits', () => {
    it('should handle very long email addresses', async () => {
      const longEmail =
        'a'.repeat(100) + '@' + 'b'.repeat(100) + '.com';

      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
      const result = await service.register({
        name: 'Long Email',
        email: longEmail,
        password: 'password',
      });

      expect(result.email).toBe(longEmail.toLowerCase());
    });

    it('should handle empty interests array', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
      const result = await service.register({
        name: 'No Interests',
        email: 'nointerests@example.com',
        password: 'password',
        interests: [],
      });

      expect(result.profile!.interests).toEqual([]);
    });

    it('should handle large interests array', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
      const manyInterests = Array.from({ length: 50 }, (_, i) => `interest-${i}`);

      const result = await service.register({
        name: 'Many Interests',
        email: 'manyinterests@example.com',
        password: 'password',
        interests: manyInterests,
      });

      expect(result.profile!.interests).toHaveLength(50);
    });

    it('should handle whitespace in email (trimming not done)', async () => {
      // Note: Le code ne trimme pas, donc ' space@example.com ' sera différent
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');

      await expect(
        service.register({
          name: 'Space Email',
          email: ' space@example.com ',
          password: 'password',
        }),
      ).resolves.toBeDefined();
    });
  });
});
