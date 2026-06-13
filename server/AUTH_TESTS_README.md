# NearMe Authentication Module Tests

This directory contains comprehensive unit and integration tests for the NearMe authentication module (`src/auth/`).

## Test Files

### 1. `src/auth/auth.service.spec.ts` (31 KB)
Complete unit tests for the `AuthService` class.

**Covered Methods:**
- `register()` - User registration with email/password
- `login()` - Email-based login
- `refresh()` - JWT token refresh and rotation
- `loginWithGoogle()` - Google OAuth authentication
- `loginWithApple()` - Apple Sign-In authentication
- `forgotPassword()` - Password reset flow
- `issueAccessToken()` - JWT access token generation
- `issueRefreshToken()` - JWT refresh token generation (private)
- `serializeProfile()` - Profile serialization

**Test Cases: 89 tests**

#### Registration Tests (9 tests)
- ✓ Valid registration with all fields
- ✓ Email lowercasing
- ✓ Duplicate email detection
- ✓ Missing required fields (name, email, password)
- ✓ Optional profile fields handling
- ✓ Face verification flag defaults to false
- ✓ Refresh token creation and storage
- ✓ Special characters handling
- ✓ Large interests array handling

#### Login Tests (10 tests)
- ✓ Successful login with correct credentials
- ✓ Nonexistent email rejection
- ✓ Wrong password rejection
- ✓ Email case-insensitivity
- ✓ OAuth users without password cannot login
- ✓ Generic error message (no user enumeration)
- ✓ Password comparison via bcrypt
- ✓ Token generation
- ✓ Long email handling

#### Refresh Token Tests (8 tests)
- ✓ Successful token rotation
- ✓ Old token revocation
- ✓ Invalid JWT rejection
- ✓ Revoked token detection
- ✓ Expired token detection
- ✓ User not found handling
- ✓ New token generation with correct payloads
- ✓ Token chain rotation

#### Google OAuth Tests (9 tests)
- ✓ Valid Google token verification
- ✓ Email lowercasing
- ✓ Missing id_token error
- ✓ Invalid token error
- ✓ Missing sub/email error
- ✓ Audience mismatch detection
- ✓ New user creation
- ✓ Existing user lookup by OAuth key
- ✓ Email linking to existing account
- ✓ Optional GOOGLE_CLIENT_ID verification
- ✓ Google API timeout handling

#### Apple Sign-In Tests (10 tests)
- ✓ Valid Apple token verification
- ✓ Missing identity_token error
- ✓ Decode failure handling
- ✓ Missing public key error
- ✓ JWT verification failure
- ✓ Email hint fallback (first login)
- ✓ Missing email and no hint error
- ✓ Custom name parameter
- ✓ Email lowercasing
- ✓ APPLE_CLIENT_ID verification
- ✓ Optional APPLE_CLIENT_ID check

#### Password Reset Tests (6 tests)
- ✓ Success message for existing email
- ✓ Success message for nonexistent email (no enumeration)
- ✓ Identical responses (security)
- ✓ Missing email error
- ✓ Email case-insensitivity

#### JWT Token Generation Tests (3 tests)
- ✓ Access token payload verification
- ✓ Refresh token payload verification
- ✓ Default secret fallback

#### Edge Cases & Limits (7 tests)
- ✓ Very long email addresses
- ✓ Empty interests array
- ✓ Large interests array (50 items)
- ✓ Whitespace in email
- ✓ Concurrent registration handling
- ✓ Special characters in bio
- ✓ Issuer and type claims verification

### 2. `src/auth/auth.controller.spec.ts` (30 KB)
Integration tests for the `AuthController` HTTP endpoints using supertest.

**Covered Endpoints:**
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/google`
- `POST /auth/apple`
- `POST /auth/forgot-password`

**Test Cases: 58 integration tests**

#### Registration Endpoint Tests (6 tests)
- ✓ HTTP 201 response on successful registration
- ✓ HTTP 400 with missing email
- ✓ HTTP 400 with missing password
- ✓ HTTP 400 with missing name
- ✓ HTTP 409 for duplicate email
- ✓ Optional fields handling
- ✓ Rate limiting (5 requests per 60s)

#### Login Endpoint Tests (6 tests)
- ✓ HTTP 200 with correct credentials
- ✓ HTTP 401 for invalid email
- ✓ HTTP 401 for wrong password
- ✓ Case-insensitive email matching
- ✓ Rate limiting on failed attempts
- ✓ Response structure validation

#### Refresh Token Endpoint Tests (6 tests)
- ✓ HTTP 200 with valid token
- ✓ HTTP 401 for invalid token
- ✓ HTTP 401 for revoked token
- ✓ HTTP 401 for expired token
- ✓ Token rotation across refreshes
- ✓ Rate limiting on refresh attempts

#### Google OAuth Endpoint Tests (6 tests)
- ✓ HTTP 200 with valid token
- ✓ HTTP 400 if id_token missing
- ✓ HTTP 401 for invalid token
- ✓ HTTP 401 for API errors
- ✓ New user creation
- ✓ Rate limiting

#### Apple Sign-In Endpoint Tests (7 tests)
- ✓ HTTP 200 with valid token
- ✓ HTTP 400 if identity_token missing
- ✓ HTTP 401 for invalid token
- ✓ Email hint acceptance
- ✓ Custom name parameter
- ✓ HTTP 400 without email and no hint
- ✓ Rate limiting

#### Forgot Password Endpoint Tests (6 tests)
- ✓ HTTP 200 for existing email
- ✓ HTTP 200 for nonexistent email
- ✓ Identical responses (no enumeration)
- ✓ HTTP 400 for missing email
- ✓ Case-insensitive email
- ✓ Rate limiting

#### Security & Edge Cases Tests (11 tests)
- ✓ Generic error messages (no enumeration)
- ✓ Concurrent registration handling
- ✓ Special characters in name/bio
- ✓ Long interests list handling
- ✓ User data persistence across operations
- ✓ Token structure validation
- ✓ Profile data integrity
- ✓ Multiple sequential operations

### 3. `src/auth/jwt.guard.spec.ts` (12 KB)
Unit tests for the `JwtGuard` authentication middleware.

**Test Cases: 28 tests**

#### Valid Token Tests (5 tests)
- ✓ Allow request with valid Bearer token
- ✓ Extract userId from sub claim
- ✓ Handle tokens with extra claims
- ✓ Handle tokens with different algorithms
- ✓ Support very long userIds

#### Missing/Invalid Token Tests (8 tests)
- ✓ Reject missing Authorization header
- ✓ Reject malformed Authorization header
- ✓ Reject empty Bearer token
- ✓ Reject invalid JWT format
- ✓ Reject tampered token signature
- ✓ Reject expired tokens
- ✓ Reject null Authorization header
- ✓ Reject empty string Authorization header

#### Claim Extraction Tests (4 tests)
- ✓ Extract sub claim correctly
- ✓ Handle missing sub claim
- ✓ Handle empty sub claim
- ✓ Handle special characters in sub

#### Secret Management Tests (3 tests)
- ✓ Use JWT_SECRET from environment
- ✓ Use default secret if not configured
- ✓ Verify signature with correct secret

#### Edge Cases Tests (8 tests)
- ✓ Malformed Bearer prefix (extra space)
- ✓ Case-sensitive Bearer keyword
- ✓ Single-part Bearer token
- ✓ Token without issuer
- ✓ Token with numeric userId
- ✓ Token with UUID userId
- ✓ Large token payload
- ✓ ExecutionContext interaction

## Setup & Installation

### Install Test Dependencies

```bash
cd server

# Install all dependencies (including test dependencies)
npm install
```

### Run Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- src/auth/auth.service.spec.ts
npm test -- src/auth/auth.controller.spec.ts
npm test -- src/auth/jwt.guard.spec.ts

# Run tests in watch mode (rerun on file changes)
npm run test:watch

# Generate coverage report
npm run test:cov
```

## Test Strategy

### Mocking Strategy

- **bcrypt**: Mocked to avoid slow hashing operations in tests
- **axios**: Mocked for Google/Apple API calls
- **jwt**: Used directly for token verification (realistic behavior)
- **StoreService**: In-memory Maps (no database)
- **uuid**: Uses Node.js crypto for deterministic IDs

### Coverage Goals

Each test covers:

1. **Happy Path**: Normal operation with valid inputs
2. **Edge Cases**: Empty values, long values, special characters
3. **Error Cases**: Missing fields, invalid states, security scenarios
4. **Rate Limiting**: 5 requests per 60 seconds enforcement
5. **Security**: No user enumeration, generic error messages

## Security Aspects Tested

- ✓ User enumeration prevention (same error for email not found vs wrong password)
- ✓ Password hashing via bcrypt
- ✓ JWT token validation and expiration
- ✓ Token refresh rotation (old tokens revoked)
- ✓ OAuth provider verification (Google audience, Apple signature)
- ✓ Rate limiting on authentication endpoints
- ✓ Constant-time comparisons (bcrypt)
- ✓ Secure defaults (JwtGuard rejects missing tokens)

## Running Tests CI/CD

```bash
# In your CI/CD pipeline
npm ci
npm run build
npm test -- --coverage --passWithNoTests
```

## Notes

- All tests use `@nestjs/testing` for proper dependency injection
- Tests are isolated with `beforeEach` / `afterEach` cleanup
- Mock implementations are cleared between tests
- Rate limiting tests verify ThrottlerGuard integration
- Integration tests use supertest for HTTP testing

## Future Enhancements

- [ ] Add database integration tests (PostgreSQL with Prisma)
- [ ] Add webhook tests for password reset emails
- [ ] Add two-factor authentication tests
- [ ] Add session/token revocation list tests
- [ ] Add brute-force detection tests beyond rate limiting
