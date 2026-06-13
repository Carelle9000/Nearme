"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const request = require("supertest");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const axios_1 = require("axios");
const auth_controller_1 = require("./auth.controller");
const auth_service_1 = require("./auth.service");
const store_service_1 = require("../store/store.service");
const throttler_1 = require("@nestjs/throttler");
jest.mock('axios');
jest.mock('bcrypt');
describe('AuthController (e2e)', () => {
    let app;
    let authService;
    let store;
    beforeAll(async () => {
        const moduleFixture = await testing_1.Test.createTestingModule({
            imports: [
                throttler_1.ThrottlerModule.forRoot([
                    {
                        name: 'default',
                        ttl: 60_000,
                        limit: 5,
                    },
                ]),
            ],
            controllers: [auth_controller_1.AuthController],
            providers: [auth_service_1.AuthService, store_service_1.StoreService],
        }).compile();
        app = moduleFixture.createNestApplication();
        await app.init();
        authService = moduleFixture.get(auth_service_1.AuthService);
        store = moduleFixture.get(store_service_1.StoreService);
        process.env.JWT_SECRET = 'test_jwt_secret_32_chars_long_enough';
        process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_32chars_long_enough';
        process.env.GOOGLE_CLIENT_ID = 'test-google-client-id.apps.googleusercontent.com';
        process.env.APPLE_CLIENT_ID = 'com.nearme.app';
    });
    afterAll(async () => {
        await app.close();
    });
    beforeEach(() => {
        store.users.clear();
        store.usersByEmail.clear();
        store.usersByOAuth.clear();
        store.profiles.clear();
        store.refreshTokens.clear();
        jest.clearAllMocks();
    });
    describe('POST /auth/register', () => {
        it('should register a new user', async () => {
            bcrypt.hash.mockResolvedValue('hashed_password');
            const response = await request(app.getHttpServer())
                .post('/auth/register')
                .send({
                name: 'John Doe',
                email: 'john@example.com',
                password: 'securePassword123',
                gender: 'male',
                heightCm: 180,
                bio: 'Looking for fun',
                intention: 'dating',
                location: 'Paris',
                interests: ['travel', 'music'],
            })
                .expect(201);
            expect(response.body).toHaveProperty('user_id');
            expect(response.body).toHaveProperty('access_token');
            expect(response.body).toHaveProperty('refresh_token');
            expect(response.body).toHaveProperty('profile');
            expect(response.body.email).toBe('john@example.com');
            expect(response.body.profile.name).toBe('John Doe');
        });
        it('should return 400 if email is missing', async () => {
            bcrypt.hash.mockResolvedValue('hashed_password');
            const response = await request(app.getHttpServer())
                .post('/auth/register')
                .send({
                name: 'John Doe',
                password: 'password',
            })
                .expect(400);
            expect(response.body.message).toContain('email');
        });
        it('should return 400 if password is missing', async () => {
            bcrypt.hash.mockResolvedValue('hashed_password');
            const response = await request(app.getHttpServer())
                .post('/auth/register')
                .send({
                name: 'John Doe',
                email: 'john@example.com',
            })
                .expect(400);
            expect(response.body.message).toContain('password');
        });
        it('should return 400 if name is missing', async () => {
            bcrypt.hash.mockResolvedValue('hashed_password');
            const response = await request(app.getHttpServer())
                .post('/auth/register')
                .send({
                email: 'john@example.com',
                password: 'password',
            })
                .expect(400);
            expect(response.body.message).toContain('name');
        });
        it('should return 409 if email already exists', async () => {
            bcrypt.hash.mockResolvedValue('hashed_password');
            await request(app.getHttpServer())
                .post('/auth/register')
                .send({
                name: 'John Doe',
                email: 'john@example.com',
                password: 'password1',
            })
                .expect(201);
            const response = await request(app.getHttpServer())
                .post('/auth/register')
                .send({
                name: 'Jane Doe',
                email: 'john@example.com',
                password: 'password2',
            })
                .expect(409);
            expect(response.body.message).toContain('Email already in use');
        });
        it('should handle optional fields correctly', async () => {
            bcrypt.hash.mockResolvedValue('hashed_password');
            const response = await request(app.getHttpServer())
                .post('/auth/register')
                .send({
                name: 'Minimal User',
                email: 'minimal@example.com',
                password: 'password',
            })
                .expect(201);
            expect(response.body.profile.gender).toBeNull();
            expect(response.body.profile.height_cm).toBeNull();
            expect(response.body.profile.bio).toBeNull();
            expect(response.body.profile.interests).toEqual([]);
        });
        it('should rate-limit after 5 requests', async () => {
            bcrypt.hash.mockResolvedValue('hashed_password');
            for (let i = 0; i < 5; i++) {
                await request(app.getHttpServer())
                    .post('/auth/register')
                    .send({
                    name: `User ${i}`,
                    email: `user${i}@example.com`,
                    password: 'password',
                })
                    .expect(201);
            }
            const response = await request(app.getHttpServer())
                .post('/auth/register')
                .send({
                name: 'User 6',
                email: 'user6@example.com',
                password: 'password',
            });
            expect(response.status).toBe(429);
        });
    });
    describe('POST /auth/login', () => {
        beforeEach(async () => {
            bcrypt.hash.mockResolvedValue('hashed_password');
            await request(app.getHttpServer())
                .post('/auth/register')
                .send({
                name: 'Login Test',
                email: 'login@example.com',
                password: 'correctPassword',
            })
                .expect(201);
            jest.clearAllMocks();
        });
        it('should login successfully with correct credentials', async () => {
            bcrypt.compare.mockResolvedValue(true);
            const response = await request(app.getHttpServer())
                .post('/auth/login')
                .send({
                email: 'login@example.com',
                password: 'correctPassword',
            })
                .expect(200);
            expect(response.body).toHaveProperty('user_id');
            expect(response.body).toHaveProperty('access_token');
            expect(response.body).toHaveProperty('refresh_token');
            expect(response.body.email).toBe('login@example.com');
        });
        it('should return 401 for invalid email', async () => {
            bcrypt.compare.mockResolvedValue(true);
            const response = await request(app.getHttpServer())
                .post('/auth/login')
                .send({
                email: 'nonexistent@example.com',
                password: 'password',
            })
                .expect(401);
            expect(response.body.message).toBe('Invalid credentials');
        });
        it('should return 401 for incorrect password', async () => {
            bcrypt.compare.mockResolvedValue(false);
            const response = await request(app.getHttpServer())
                .post('/auth/login')
                .send({
                email: 'login@example.com',
                password: 'wrongPassword',
            })
                .expect(401);
            expect(response.body.message).toBe('Invalid credentials');
        });
        it('should treat uppercase and lowercase emails the same', async () => {
            bcrypt.compare.mockResolvedValue(true);
            const response = await request(app.getHttpServer())
                .post('/auth/login')
                .send({
                email: 'LOGIN@EXAMPLE.COM',
                password: 'correctPassword',
            })
                .expect(200);
            expect(response.body.email).toBe('login@example.com');
        });
        it('should rate-limit login attempts', async () => {
            bcrypt.compare.mockResolvedValue(false);
            for (let i = 0; i < 5; i++) {
                await request(app.getHttpServer())
                    .post('/auth/login')
                    .send({
                    email: 'login@example.com',
                    password: 'wrongPassword',
                })
                    .expect(401);
            }
            const response = await request(app.getHttpServer())
                .post('/auth/login')
                .send({
                email: 'login@example.com',
                password: 'wrongPassword',
            });
            expect(response.status).toBe(429);
        });
    });
    describe('POST /auth/refresh', () => {
        let refreshToken;
        let userId;
        beforeEach(async () => {
            bcrypt.hash.mockResolvedValue('hashed_password');
            const registerResponse = await request(app.getHttpServer())
                .post('/auth/register')
                .send({
                name: 'Refresh Test',
                email: 'refresh@example.com',
                password: 'password',
            })
                .expect(201);
            refreshToken = registerResponse.body.refresh_token;
            userId = registerResponse.body.user_id;
            jest.clearAllMocks();
        });
        it('should refresh tokens successfully', async () => {
            const response = await request(app.getHttpServer())
                .post('/auth/refresh')
                .send({
                refresh_token: refreshToken,
            })
                .expect(200);
            expect(response.body).toHaveProperty('user_id', userId);
            expect(response.body).toHaveProperty('access_token');
            expect(response.body).toHaveProperty('refresh_token');
            expect(response.body.refresh_token).not.toBe(refreshToken);
        });
        it('should return 401 for invalid refresh token', async () => {
            const response = await request(app.getHttpServer())
                .post('/auth/refresh')
                .send({
                refresh_token: 'invalid.token.format',
            })
                .expect(401);
            expect(response.body.message).toContain('Invalid refresh token');
        });
        it('should return 401 for revoked token', async () => {
            const tokenRecord = store.refreshTokens.get(refreshToken);
            tokenRecord.revokedAt = new Date();
            const response = await request(app.getHttpServer())
                .post('/auth/refresh')
                .send({
                refresh_token: refreshToken,
            })
                .expect(401);
            expect(response.body.message).toContain('Token revoked');
        });
        it('should return 401 for expired token', async () => {
            const tokenRecord = store.refreshTokens.get(refreshToken);
            tokenRecord.expiresAt = new Date(Date.now() - 1000);
            const response = await request(app.getHttpServer())
                .post('/auth/refresh')
                .send({
                refresh_token: refreshToken,
            })
                .expect(401);
            expect(response.body.message).toContain('Token expired');
        });
        it('should rotate tokens on each refresh', async () => {
            const firstResponse = await request(app.getHttpServer())
                .post('/auth/refresh')
                .send({
                refresh_token: refreshToken,
            })
                .expect(200);
            const secondResponse = await request(app.getHttpServer())
                .post('/auth/refresh')
                .send({
                refresh_token: firstResponse.body.refresh_token,
            })
                .expect(200);
            expect(secondResponse.body.refresh_token).not.toBe(firstResponse.body.refresh_token);
        });
        it('should rate-limit refresh attempts', async () => {
            for (let i = 0; i < 5; i++) {
                const response = await request(app.getHttpServer())
                    .post('/auth/refresh')
                    .send({
                    refresh_token: refreshToken,
                })
                    .expect(200);
                refreshToken = response.body.refresh_token;
            }
            const response = await request(app.getHttpServer())
                .post('/auth/refresh')
                .send({
                refresh_token: refreshToken,
            });
            expect(response.status).toBe(429);
        });
    });
    describe('POST /auth/google', () => {
        const validGoogleToken = jwt.sign({
            sub: 'google-user-123',
            email: 'google@example.com',
            name: 'Google User',
        }, 'google-secret');
        it('should login with valid Google token', async () => {
            axios_1.default.get.mockResolvedValue({
                data: {
                    sub: 'google-user-123',
                    email: 'google@example.com',
                    name: 'Google User',
                    email_verified: 'true',
                    aud: 'test-google-client-id.apps.googleusercontent.com',
                },
            });
            const response = await request(app.getHttpServer())
                .post('/auth/google')
                .send({
                id_token: validGoogleToken,
            })
                .expect(200);
            expect(response.body).toHaveProperty('user_id');
            expect(response.body).toHaveProperty('access_token');
            expect(response.body).toHaveProperty('refresh_token');
            expect(response.body.email).toBe('google@example.com');
        });
        it('should return 400 if id_token is missing', async () => {
            const response = await request(app.getHttpServer())
                .post('/auth/google')
                .send({})
                .expect(400);
            expect(response.body.message).toContain('id_token');
        });
        it('should return 401 for invalid Google token', async () => {
            axios_1.default.get.mockRejectedValue(new Error('Invalid token'));
            const response = await request(app.getHttpServer())
                .post('/auth/google')
                .send({
                id_token: 'invalid-token',
            })
                .expect(401);
            expect(response.body.message).toContain('Invalid Google token');
        });
        it('should return 401 if Google API returns error', async () => {
            axios_1.default.get.mockResolvedValue({
                data: {
                    error_description: 'Invalid audience',
                },
            });
            const response = await request(app.getHttpServer())
                .post('/auth/google')
                .send({
                id_token: validGoogleToken,
            })
                .expect(401);
            expect(response.body.message).toContain('Invalid Google token');
        });
        it('should create new user for first-time Google login', async () => {
            axios_1.default.get.mockResolvedValue({
                data: {
                    sub: 'google-new-user',
                    email: 'newgoogle@example.com',
                    name: 'New Google User',
                    email_verified: 'true',
                    aud: 'test-google-client-id.apps.googleusercontent.com',
                },
            });
            const response = await request(app.getHttpServer())
                .post('/auth/google')
                .send({
                id_token: validGoogleToken,
            })
                .expect(200);
            expect(response.body).toHaveProperty('user_id');
            expect(store.users.size).toBe(1);
        });
        it('should rate-limit Google login attempts', async () => {
            axios_1.default.get.mockResolvedValue({
                data: {
                    sub: `google-user-${Date.now()}`,
                    email: `google${Date.now()}@example.com`,
                    name: 'Google User',
                    email_verified: 'true',
                    aud: 'test-google-client-id.apps.googleusercontent.com',
                },
            });
            for (let i = 0; i < 5; i++) {
                await request(app.getHttpServer())
                    .post('/auth/google')
                    .send({
                    id_token: validGoogleToken,
                })
                    .expect(200);
            }
            const response = await request(app.getHttpServer())
                .post('/auth/google')
                .send({
                id_token: validGoogleToken,
            });
            expect(response.status).toBe(429);
        });
    });
    describe('POST /auth/apple', () => {
        const validAppleToken = jwt.sign({
            sub: 'apple-user-123',
            email: 'apple@example.com',
            iss: 'https://appleid.apple.com',
        }, 'apple-secret', { algorithm: 'RS256' });
        beforeEach(() => {
            jest.spyOn(jwt, 'decode').mockReturnValue({
                header: { kid: 'test-key-id' },
                payload: {
                    sub: 'apple-user-123',
                    email: 'apple@example.com',
                },
            });
        });
        it('should login with valid Apple token', async () => {
            axios_1.default.get.mockResolvedValue({
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
            });
            const response = await request(app.getHttpServer())
                .post('/auth/apple')
                .send({
                identity_token: validAppleToken,
            })
                .expect(200);
            expect(response.body).toHaveProperty('user_id');
            expect(response.body).toHaveProperty('access_token');
            expect(response.body).toHaveProperty('refresh_token');
            expect(response.body.email).toBe('apple@example.com');
        });
        it('should return 400 if identity_token is missing', async () => {
            const response = await request(app.getHttpServer())
                .post('/auth/apple')
                .send({})
                .expect(400);
            expect(response.body.message).toContain('identity_token');
        });
        it('should return 401 for invalid Apple token', async () => {
            jest.spyOn(jwt, 'decode').mockReturnValue(null);
            const response = await request(app.getHttpServer())
                .post('/auth/apple')
                .send({
                identity_token: validAppleToken,
            })
                .expect(401);
            expect(response.body.message).toContain('Invalid Apple token');
        });
        it('should accept email hint if token missing email', async () => {
            axios_1.default.get.mockResolvedValue({
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
                iss: 'https://appleid.apple.com',
            });
            const response = await request(app.getHttpServer())
                .post('/auth/apple')
                .send({
                identity_token: validAppleToken,
                email: 'hinted@example.com',
            })
                .expect(200);
            expect(response.body.email).toBe('hinted@example.com');
        });
        it('should accept name parameter', async () => {
            axios_1.default.get.mockResolvedValue({
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
            });
            const response = await request(app.getHttpServer())
                .post('/auth/apple')
                .send({
                identity_token: validAppleToken,
                name: 'Custom Name',
            })
                .expect(200);
            expect(response.body.profile.name).toBe('Custom Name');
        });
        it('should return 400 if email missing and no email hint', async () => {
            axios_1.default.get.mockResolvedValue({
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
                iss: 'https://appleid.apple.com',
            });
            const response = await request(app.getHttpServer())
                .post('/auth/apple')
                .send({
                identity_token: validAppleToken,
            })
                .expect(400);
            expect(response.body.message).toContain('Email is required');
        });
        it('should rate-limit Apple login attempts', async () => {
            axios_1.default.get.mockResolvedValue({
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
            jest.spyOn(jwt, 'verify').mockImplementation((token) => {
                return {
                    sub: `apple-user-${Date.now()}`,
                    email: `apple${Date.now()}@example.com`,
                    iss: 'https://appleid.apple.com',
                };
            });
            for (let i = 0; i < 5; i++) {
                await request(app.getHttpServer())
                    .post('/auth/apple')
                    .send({
                    identity_token: validAppleToken,
                })
                    .expect(200);
            }
            const response = await request(app.getHttpServer())
                .post('/auth/apple')
                .send({
                identity_token: validAppleToken,
            });
            expect(response.status).toBe(429);
        });
    });
    describe('POST /auth/forgot-password', () => {
        beforeEach(async () => {
            bcrypt.hash.mockResolvedValue('hashed_password');
            await request(app.getHttpServer())
                .post('/auth/register')
                .send({
                name: 'Password Reset Test',
                email: 'reset@example.com',
                password: 'oldPassword',
            })
                .expect(201);
            jest.clearAllMocks();
        });
        it('should return success for existing email', async () => {
            const response = await request(app.getHttpServer())
                .post('/auth/forgot-password')
                .send({
                email: 'reset@example.com',
            })
                .expect(200);
            expect(response.body).toHaveProperty('message');
            expect(response.body.message).toContain('reset link');
        });
        it('should return success for nonexistent email (no user enumeration)', async () => {
            const response = await request(app.getHttpServer())
                .post('/auth/forgot-password')
                .send({
                email: 'nonexistent@example.com',
            })
                .expect(200);
            expect(response.body).toHaveProperty('message');
            expect(response.body.message).toContain('reset link');
        });
        it('should not reveal if email exists (same response for both cases)', async () => {
            const existingResponse = await request(app.getHttpServer())
                .post('/auth/forgot-password')
                .send({
                email: 'reset@example.com',
            })
                .expect(200);
            const nonExistingResponse = await request(app.getHttpServer())
                .post('/auth/forgot-password')
                .send({
                email: 'nonexistent@example.com',
            })
                .expect(200);
            expect(existingResponse.body.message).toBe(nonExistingResponse.body.message);
        });
        it('should return 400 if email is missing', async () => {
            const response = await request(app.getHttpServer())
                .post('/auth/forgot-password')
                .send({})
                .expect(400);
            expect(response.body.message).toContain('email');
        });
        it('should rate-limit forgot-password requests', async () => {
            for (let i = 0; i < 5; i++) {
                await request(app.getHttpServer())
                    .post('/auth/forgot-password')
                    .send({
                    email: `test${i}@example.com`,
                })
                    .expect(200);
            }
            const response = await request(app.getHttpServer())
                .post('/auth/forgot-password')
                .send({
                email: 'test6@example.com',
            });
            expect(response.status).toBe(429);
        });
        it('should accept uppercase email', async () => {
            const response = await request(app.getHttpServer())
                .post('/auth/forgot-password')
                .send({
                email: 'RESET@EXAMPLE.COM',
            })
                .expect(200);
            expect(response.body.message).toContain('reset link');
        });
    });
    describe('JwtGuard integration', () => {
        let accessToken;
        let userId;
        beforeEach(async () => {
            bcrypt.hash.mockResolvedValue('hashed_password');
            const response = await request(app.getHttpServer())
                .post('/auth/register')
                .send({
                name: 'JWT Test',
                email: 'jwt@example.com',
                password: 'password',
            })
                .expect(201);
            accessToken = response.body.access_token;
            userId = response.body.user_id;
            jest.clearAllMocks();
        });
        it('should decode valid access token correctly', () => {
            const payload = jwt.verify(accessToken, process.env.JWT_SECRET);
            expect(payload.sub).toBe(userId);
            expect(payload.type).toBe('access');
        });
        it('should verify token issuer is nearme', () => {
            const payload = jwt.verify(accessToken, process.env.JWT_SECRET);
            expect(payload.iss).toBe('nearme');
        });
    });
    describe('Security and edge cases', () => {
        it('should not expose sensitive error details', async () => {
            bcrypt.hash.mockResolvedValue('hashed_password');
            await request(app.getHttpServer())
                .post('/auth/register')
                .send({
                name: 'User',
                email: 'user@example.com',
                password: 'password',
            })
                .expect(201);
            jest.clearAllMocks();
            bcrypt.compare.mockResolvedValue(false);
            const response = await request(app.getHttpServer())
                .post('/auth/login')
                .send({
                email: 'user@example.com',
                password: 'wrongPassword',
            })
                .expect(401);
            expect(response.body.message).toBe('Invalid credentials');
        });
        it('should handle concurrent registration attempts', async () => {
            bcrypt.hash.mockResolvedValue('hashed_password');
            const promises = Array.from({ length: 5 }, (_, i) => request(app.getHttpServer())
                .post('/auth/register')
                .send({
                name: `User ${i}`,
                email: `user${i}@example.com`,
                password: 'password',
            }));
            const results = await Promise.all(promises);
            expect(results.every((r) => r.status === 201)).toBe(true);
            expect(store.users.size).toBe(5);
        });
        it('should handle special characters in name and bio', async () => {
            bcrypt.hash.mockResolvedValue('hashed_password');
            const response = await request(app.getHttpServer())
                .post('/auth/register')
                .send({
                name: "John O'Brien-Smith",
                email: 'special@example.com',
                password: 'password',
                bio: 'Love émojis 🎉 & special chars: <script>',
            })
                .expect(201);
            expect(response.body.profile.name).toBe("John O'Brien-Smith");
            expect(response.body.profile.bio).toContain('émojis');
        });
        it('should handle long interests list', async () => {
            bcrypt.hash.mockResolvedValue('hashed_password');
            const interests = Array.from({ length: 50 }, (_, i) => `interest-${i}`);
            const response = await request(app.getHttpServer())
                .post('/auth/register')
                .send({
                name: 'Interest Test',
                email: 'interests@example.com',
                password: 'password',
                interests,
            })
                .expect(201);
            expect(response.body.profile.interests).toHaveLength(50);
        });
        it('should persist user data across multiple operations', async () => {
            bcrypt.hash.mockResolvedValue('hashed_password');
            const registerResponse = await request(app.getHttpServer())
                .post('/auth/register')
                .send({
                name: 'Persistence Test',
                email: 'persist@example.com',
                password: 'password123',
                gender: 'male',
                heightCm: 180,
            })
                .expect(201);
            const userId = registerResponse.body.user_id;
            const refreshToken = registerResponse.body.refresh_token;
            jest.clearAllMocks();
            bcrypt.compare.mockResolvedValue(true);
            const loginResponse = await request(app.getHttpServer())
                .post('/auth/login')
                .send({
                email: 'persist@example.com',
                password: 'password123',
            })
                .expect(200);
            expect(loginResponse.body.user_id).toBe(userId);
            expect(loginResponse.body.profile.height_cm).toBe(180);
            const refreshResponse = await request(app.getHttpServer())
                .post('/auth/refresh')
                .send({
                refresh_token: refreshToken,
            })
                .expect(200);
            expect(refreshResponse.body.user_id).toBe(userId);
        });
    });
});
//# sourceMappingURL=auth.controller.spec.js.map