"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const common_1 = require("@nestjs/common");
const jwt = require("jsonwebtoken");
const jwt_guard_1 = require("./jwt.guard");
describe('JwtGuard', () => {
    let guard;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [jwt_guard_1.JwtGuard],
        }).compile();
        guard = module.get(jwt_guard_1.JwtGuard);
        process.env.JWT_SECRET = 'test_jwt_secret_32_chars_long_enough';
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('canActivate', () => {
        let mockContext;
        let mockRequest;
        beforeEach(() => {
            mockRequest = {
                headers: {},
            };
            mockContext = {
                switchToHttp: jest.fn().mockReturnValue({
                    getRequest: jest.fn().mockReturnValue(mockRequest),
                }),
            };
        });
        it('should allow request with valid Bearer token', () => {
            const userId = 'test-user-123';
            const token = jwt.sign({ sub: userId, email: 'test@example.com', type: 'access' }, process.env.JWT_SECRET, { expiresIn: '1h', issuer: 'nearme' });
            mockRequest.headers.authorization = `Bearer ${token}`;
            const result = guard.canActivate(mockContext);
            expect(result).toBe(true);
            expect(mockRequest.userId).toBe(userId);
        });
        it('should throw UnauthorizedException if Authorization header missing', () => {
            mockRequest.headers = {};
            expect(() => guard.canActivate(mockContext)).toThrow(common_1.UnauthorizedException);
            expect(() => guard.canActivate(mockContext)).toThrow('Missing token');
        });
        it('should throw UnauthorizedException if Authorization header does not start with Bearer', () => {
            mockRequest.headers.authorization = 'Basic token123';
            expect(() => guard.canActivate(mockContext)).toThrow(common_1.UnauthorizedException);
            expect(() => guard.canActivate(mockContext)).toThrow('Missing token');
        });
        it('should throw UnauthorizedException if Bearer token is empty', () => {
            mockRequest.headers.authorization = 'Bearer ';
            expect(() => guard.canActivate(mockContext)).toThrow(common_1.UnauthorizedException);
        });
        it('should throw UnauthorizedException if token is invalid JWT', () => {
            mockRequest.headers.authorization = 'Bearer invalid.token.format';
            expect(() => guard.canActivate(mockContext)).toThrow(common_1.UnauthorizedException);
            expect(() => guard.canActivate(mockContext)).toThrow('Invalid token');
        });
        it('should throw UnauthorizedException if token signature is invalid', () => {
            const token = jwt.sign({ sub: 'test-user', email: 'test@example.com' }, 'wrong-secret', { expiresIn: '1h' });
            mockRequest.headers.authorization = `Bearer ${token}`;
            expect(() => guard.canActivate(mockContext)).toThrow(common_1.UnauthorizedException);
            expect(() => guard.canActivate(mockContext)).toThrow('Invalid token');
        });
        it('should throw UnauthorizedException if token is expired', () => {
            const token = jwt.sign({ sub: 'test-user', email: 'test@example.com', type: 'access' }, process.env.JWT_SECRET, { expiresIn: '-1h', issuer: 'nearme' });
            mockRequest.headers.authorization = `Bearer ${token}`;
            expect(() => guard.canActivate(mockContext)).toThrow(common_1.UnauthorizedException);
        });
        it('should extract userId from token payload', () => {
            const userId = 'unique-user-id-456';
            const token = jwt.sign({ sub: userId, email: 'user@example.com', type: 'access' }, process.env.JWT_SECRET, { expiresIn: '1h', issuer: 'nearme' });
            mockRequest.headers.authorization = `Bearer ${token}`;
            guard.canActivate(mockContext);
            expect(mockRequest.userId).toBe(userId);
        });
        it('should handle token with extra whitespace in Bearer prefix', () => {
            const userId = 'test-user-789';
            const token = jwt.sign({ sub: userId, email: 'test@example.com', type: 'access' }, process.env.JWT_SECRET, { expiresIn: '1h', issuer: 'nearme' });
            mockRequest.headers.authorization = `Bearer  ${token}`;
            expect(() => guard.canActivate(mockContext)).toThrow(common_1.UnauthorizedException);
        });
        it('should work with lowercase "bearer"', () => {
            const userId = 'test-user-lower';
            const token = jwt.sign({ sub: userId, email: 'test@example.com', type: 'access' }, process.env.JWT_SECRET, { expiresIn: '1h', issuer: 'nearme' });
            mockRequest.headers.authorization = `bearer ${token}`;
            expect(() => guard.canActivate(mockContext)).toThrow(common_1.UnauthorizedException);
        });
        it('should handle missing Authorization header (undefined)', () => {
            mockRequest.headers.authorization = undefined;
            expect(() => guard.canActivate(mockContext)).toThrow(common_1.UnauthorizedException);
            expect(() => guard.canActivate(mockContext)).toThrow('Missing token');
        });
        it('should handle null Authorization header', () => {
            mockRequest.headers.authorization = null;
            expect(() => guard.canActivate(mockContext)).toThrow(common_1.UnauthorizedException);
        });
        it('should handle Authorization header as empty string', () => {
            mockRequest.headers.authorization = '';
            expect(() => guard.canActivate(mockContext)).toThrow(common_1.UnauthorizedException);
        });
        it('should use JWT_SECRET from environment', () => {
            const originalSecret = process.env.JWT_SECRET;
            process.env.JWT_SECRET = 'custom_secret_32_characters_long_enough';
            const token = jwt.sign({ sub: 'test-user', email: 'test@example.com', type: 'access' }, 'custom_secret_32_characters_long_enough', { expiresIn: '1h' });
            mockRequest.headers.authorization = `Bearer ${token}`;
            const result = guard.canActivate(mockContext);
            expect(result).toBe(true);
            process.env.JWT_SECRET = originalSecret;
        });
        it('should use default secret if JWT_SECRET not set', () => {
            delete process.env.JWT_SECRET;
            const defaultSecret = 'changeme_jwt_secret_32chars';
            const token = jwt.sign({ sub: 'test-user', email: 'test@example.com', type: 'access' }, defaultSecret, { expiresIn: '1h' });
            mockRequest.headers.authorization = `Bearer ${token}`;
            const result = guard.canActivate(mockContext);
            expect(result).toBe(true);
        });
        it('should extract sub claim correctly', () => {
            const userId = 'special-user-id-with-dashes-123';
            const token = jwt.sign({
                sub: userId,
                email: 'special@example.com',
                type: 'access',
                iat: Math.floor(Date.now() / 1000),
            }, process.env.JWT_SECRET, { expiresIn: '1h', issuer: 'nearme' });
            mockRequest.headers.authorization = `Bearer ${token}`;
            guard.canActivate(mockContext);
            expect(mockRequest.userId).toBe(userId);
        });
        it('should handle malformed Bearer token (single part)', () => {
            mockRequest.headers.authorization = 'Bearer eyJhbGc';
            expect(() => guard.canActivate(mockContext)).toThrow(common_1.UnauthorizedException);
        });
        it('should not attach userId if token verification fails', () => {
            mockRequest.headers.authorization = 'Bearer invalid.token.here';
            expect(() => guard.canActivate(mockContext)).toThrow(common_1.UnauthorizedException);
            expect(mockRequest.userId).toBeUndefined();
        });
        it('should handle tokens without sub claim', () => {
            const token = jwt.sign({ email: 'test@example.com', type: 'access' }, process.env.JWT_SECRET, { expiresIn: '1h', issuer: 'nearme' });
            mockRequest.headers.authorization = `Bearer ${token}`;
            guard.canActivate(mockContext);
            expect(mockRequest.userId).toBeUndefined();
        });
        it('should handle tokens with empty sub claim', () => {
            const token = jwt.sign({ sub: '', email: 'test@example.com', type: 'access' }, process.env.JWT_SECRET, { expiresIn: '1h', issuer: 'nearme' });
            mockRequest.headers.authorization = `Bearer ${token}`;
            const result = guard.canActivate(mockContext);
            expect(result).toBe(true);
            expect(mockRequest.userId).toBe('');
        });
        it('should handle tokens with very long userId', () => {
            const userId = 'a'.repeat(1000);
            const token = jwt.sign({ sub: userId, email: 'test@example.com', type: 'access' }, process.env.JWT_SECRET, { expiresIn: '1h', issuer: 'nearme' });
            mockRequest.headers.authorization = `Bearer ${token}`;
            guard.canActivate(mockContext);
            expect(mockRequest.userId).toBe(userId);
        });
        it('should handle tokens with special characters in sub', () => {
            const userId = 'user:google:12345';
            const token = jwt.sign({ sub: userId, email: 'test@example.com', type: 'access' }, process.env.JWT_SECRET, { expiresIn: '1h', issuer: 'nearme' });
            mockRequest.headers.authorization = `Bearer ${token}`;
            guard.canActivate(mockContext);
            expect(mockRequest.userId).toBe(userId);
        });
        it('should work with Authorization header in different case (header key)', () => {
            const userId = 'test-user';
            const token = jwt.sign({ sub: userId, email: 'test@example.com', type: 'access' }, process.env.JWT_SECRET, { expiresIn: '1h', issuer: 'nearme' });
            mockRequest.headers.Authorization = `Bearer ${token}`;
            delete mockRequest.headers.authorization;
            mockRequest.headers.authorization = mockRequest.headers.Authorization;
            delete mockRequest.headers.Authorization;
            guard.canActivate(mockContext);
            expect(mockRequest.userId).toBe(userId);
        });
    });
    describe('ExecutionContext interaction', () => {
        it('should correctly call switchToHttp and getRequest', () => {
            const mockRequest = {
                headers: {
                    authorization: `Bearer ${jwt.sign({ sub: 'test', email: 'test@example.com' }, process.env.JWT_SECRET, { expiresIn: '1h' })}`,
                },
            };
            const mockHttpArgumentsHost = {
                getRequest: jest.fn().mockReturnValue(mockRequest),
            };
            const mockContext = {
                switchToHttp: jest.fn().mockReturnValue(mockHttpArgumentsHost),
            };
            guard.canActivate(mockContext);
            expect(mockContext.switchToHttp).toHaveBeenCalled();
            expect(mockHttpArgumentsHost.getRequest).toHaveBeenCalled();
        });
    });
});
//# sourceMappingURL=jwt.guard.spec.js.map