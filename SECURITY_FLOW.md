# Authentication & Authorization Flow - Security Analysis

## 🔐 Current Flow Overview

### 1. Login Flow (Kratos)

```
User → Login Form → Kratos Login Flow → Kratos Session Cookie → Dashboard
```

**Steps:**
1. User enters credentials on `/auth/login`
2. Client requests login flow from Kratos: `GET /self-service/login/browser?return_to=...`
   - **CSRF Protection**: Kratos sets CSRF cookie (`csrf_token_*`) in browser
   - **Response**: JSON with flow ID and CSRF token
3. Client submits login: `POST /self-service/login?flow={id}`
   - **CSRF Token**: Included in body (`csrf_token`)
   - **Credentials**: Password + identifier sent in body
   - **Cookie**: CSRF cookie automatically sent by browser
4. Kratos validates:
   - ✅ CSRF token matches CSRF cookie
   - ✅ Credentials are correct
   - ✅ Session created
5. Kratos sets session cookie: `ory_kratos_session` (HttpOnly, SameSite: Lax)
6. Redirect to dashboard

**Security Features:**
- ✅ CSRF Protection (Kratos built-in)
- ✅ HttpOnly Cookies (prevents XSS)
- ✅ SameSite: Lax (prevents CSRF)
- ✅ Secure password handling (never logged)
- ✅ Session management (Kratos built-in)

---

### 2. OAuth2 Flow (Hydra) - When Needed

```
User → /api/auth/me → 401 → Start OAuth2 → Hydra → Kratos Session Check → Hydra Tokens → Cookies
```

**Steps:**
1. User makes request to protected endpoint
2. Server checks Kratos session via `/api/auth/me`
3. If no session, redirect to OAuth2 flow: `/api/auth/oauth/authorize`
4. **PKCE Generation** (client-side):
   - Generate `code_verifier` (random 43-128 chars)
   - Generate `code_challenge` (SHA256 of verifier)
   - Store `code_verifier` in HttpOnly cookie
   - Store `state` in HttpOnly cookie
5. Redirect to Hydra: `GET /oauth2/auth?client_id=...&code_challenge=...&state=...`
6. Hydra checks Kratos session via `/api/auth/oauth/hydra-login`
7. If valid session, Hydra accepts login challenge
8. Hydra redirects to consent: `/api/auth/oauth/hydra-consent`
9. Hydra issues authorization code
10. Client exchanges code for tokens: `POST /api/auth/oauth/callback`
    - **PKCE Verification**: `code_verifier` from cookie matches `code_challenge`
    - **State Verification**: `state` from cookie matches request
11. Server sets tokens in HttpOnly cookies:
    - `hydra_access_token` (HttpOnly, SameSite: Lax)
    - `hydra_refresh_token` (HttpOnly, SameSite: Lax)

**Security Features:**
- ✅ PKCE (Proof Key for Code Exchange) - Required for public clients
- ✅ State parameter (prevents CSRF)
- ✅ Authorization Code Flow (most secure)
- ✅ HttpOnly Cookies (prevents XSS)
- ✅ SameSite: Lax (prevents CSRF)
- ✅ Secure token storage (never in localStorage/sessionStorage)

---

## 🔒 Security Checklist

### ✅ Implemented Security Measures

1. **CSRF Protection**
   - ✅ Kratos CSRF tokens (automatic)
   - ✅ OAuth2 state parameter
   - ✅ SameSite: Lax cookies

2. **XSS Protection**
   - ✅ HttpOnly cookies (tokens not accessible via JavaScript)
   - ✅ Content Security Policy (should be configured)
   - ✅ Input validation (Zod schemas)

3. **OAuth2 Security**
   - ✅ PKCE (required for public clients)
   - ✅ Authorization Code Flow (not Implicit Flow)
   - ✅ Secure token storage (HttpOnly cookies)
   - ✅ Token refresh mechanism

4. **Session Management**
   - ✅ Secure session cookies (HttpOnly, SameSite: Lax)
   - ✅ Session expiration (Kratos configurable)
   - ✅ Session invalidation on logout

5. **Password Security**
   - ✅ Never logged or exposed
   - ✅ Server-side validation (Kratos)
   - ✅ Password hashing (bcrypt - Kratos built-in)

6. **CORS Configuration**
   - ✅ Restricted origins (`localhost:3000`, `localhost:4455`)
   - ✅ Credentials allowed (`allow_credentials: true`)
   - ✅ Allowed headers explicitly defined

---

## ⚠️ Potential Security Issues & Recommendations

### 1. **CORS Configuration**
**Current**: Restricted to `localhost:3000` and `localhost:4455`
**Recommendation**: 
- ✅ For production, use environment variables
- ✅ Add specific production domains
- ✅ Remove `localhost` origins in production

### 2. **Cookie Security**
**Current**: `SameSite: Lax`, `HttpOnly: true`, `domain: localhost`
**Recommendation**:
- ✅ In production, use `Secure: true` (HTTPS only)
- ✅ Consider `SameSite: Strict` for higher security
- ✅ Set proper `domain` for production

### 3. **PKCE Implementation**
**Current**: ✅ Properly implemented
- Code verifier generated client-side
- Code challenge sent to Hydra
- Code verifier stored in HttpOnly cookie
- Verification on callback

**Status**: ✅ **Secure**

### 4. **Session Management**
**Current**: Kratos manages sessions (30 days lifespan)
**Recommendation**:
- ✅ Consider shorter session lifespan for production
- ✅ Implement session rotation
- ✅ Monitor active sessions

### 5. **Error Handling**
**Current**: Errors may expose sensitive information
**Recommendation**:
- ✅ Sanitize error messages in production
- ✅ Log errors server-side only
- ✅ Don't expose stack traces to client

### 6. **Rate Limiting**
**Current**: ✅ Implemented in some endpoints
**Recommendation**:
- ✅ Add rate limiting to all auth endpoints
- ✅ Use Kratos rate limiting features
- ✅ Monitor for brute force attacks

### 7. **Input Validation**
**Current**: ✅ Zod schemas used
**Status**: ✅ **Secure**

### 8. **HTTPS**
**Current**: Development (HTTP)
**Recommendation**:
- ⚠️ **MUST** use HTTPS in production
- ✅ Set `Secure` flag on cookies in production
- ✅ Use TLS 1.3 minimum

---

## 📋 Flow Diagram

```
┌─────────┐
│  User   │
└────┬────┘
     │
     │ 1. Enter Credentials
     ▼
┌─────────────────┐
│  /auth/login    │
└────┬────────────┘
     │
     │ 2. GET /self-service/login/browser
     ▼
┌─────────────────┐      ┌──────────────┐
│  Kratos         │◄─────┤ CSRF Cookie  │
│  Login Flow     │      │  Set         │
└────┬────────────┘      └──────────────┘
     │
     │ 3. POST /self-service/login (with CSRF token)
     ▼
┌─────────────────┐      ┌──────────────┐
│  Kratos         │─────►│ Session      │
│  Validates      │      │  Cookie Set  │
└────┬────────────┘      └──────────────┘
     │
     │ 4. Redirect
     ▼
┌─────────────────┐
│  /dashboard     │
└────┬────────────┘
     │
     │ 5. GET /api/auth/me
     ▼
┌─────────────────┐
│  Check Session  │
└────┬────────────┘
     │
     │ If no session → OAuth2 Flow
     ▼
┌─────────────────┐
│  /api/auth/     │
│  oauth/authorize│
└────┬────────────┘
     │
     │ 6. Generate PKCE + State
     │    Store in HttpOnly cookies
     ▼
┌─────────────────┐
│  Hydra OAuth2   │
│  Authorization  │
└────┬────────────┘
     │
     │ 7. Check Kratos Session
     ▼
┌─────────────────┐
│  /api/auth/     │
│  oauth/         │
│  hydra-login    │
└────┬────────────┘
     │
     │ 8. Accept Login Challenge
     ▼
┌─────────────────┐
│  Hydra          │
│  Issues Code    │
└────┬────────────┘
     │
     │ 9. Exchange Code for Tokens
     ▼
┌─────────────────┐      ┌──────────────┐
│  /api/auth/     │─────►│ Access Token │
│  oauth/callback │      │  Cookie Set  │
└─────────────────┘      └──────────────┘
```

---

## ✅ Security Best Practices Followed

1. ✅ **Never store tokens in localStorage/sessionStorage**
   - All tokens in HttpOnly cookies

2. ✅ **PKCE for OAuth2**
   - Required for public clients
   - Prevents authorization code interception

3. ✅ **CSRF Protection**
   - Kratos built-in CSRF protection
   - OAuth2 state parameter

4. ✅ **Secure Session Management**
   - HttpOnly cookies
   - SameSite: Lax
   - Session expiration

5. ✅ **Input Validation**
   - Zod schemas
   - Server-side validation

6. ✅ **Error Handling**
   - Sanitized error messages
   - Server-side logging

---

## 🚨 Production Checklist

Before deploying to production:

- [ ] Enable HTTPS
- [ ] Set `Secure` flag on all cookies
- [ ] Configure proper CORS origins
- [ ] Set production domain for cookies
- [ ] Enable rate limiting
- [ ] Configure Content Security Policy
- [ ] Set up monitoring and alerting
- [ ] Review and update session lifespan
- [ ] Test all flows end-to-end
- [ ] Security audit
- [ ] Penetration testing

---

## 📚 References

- [Ory Kratos Security](https://www.ory.sh/kratos/docs/security)
- [Ory Hydra Security](https://www.ory.sh/hydra/docs/security)
- [OAuth2 Security Best Practices](https://tools.ietf.org/html/draft-ietf-oauth-security-topics)
- [PKCE RFC 7636](https://tools.ietf.org/html/rfc7636)

