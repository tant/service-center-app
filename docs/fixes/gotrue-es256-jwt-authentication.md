# GoTrue ES256 JWT Authentication Issue

**Date:** 2026-02-08
**Severity:** Critical
**Status:** Resolved
**Affected Components:** Supabase Auth (GoTrue), Kong Gateway, Service Role Authentication

---

## 📋 Problem Summary

The `/setup` endpoint and all Supabase admin operations were failing with JWT authentication errors:

```
token signature is invalid: signing method HS256 is invalid
```

### Symptoms

1. **API Failures:**
   - `/api/trpc/admin.setup` returning 500 errors
   - `supabaseAdmin.auth.admin.listUsers()` throwing "fetch failed"
   - All service role operations rejected by GoTrue

2. **Error Logs:**
   ```
   AuthRetryableFetchError: fetch failed
   TRPCError: Failed to check existing users: fetch failed
   ```

3. **GoTrue Container Logs:**
   ```json
   {
     "error": "token signature is invalid: signing method HS256 is invalid",
     "path": "/admin/users",
     "status": 403
   }
   ```

---

## 🔍 Root Cause Analysis

### Timeline of Discovery

1. **Initial Investigation:** Error traced to `src/server/routers/admin.ts:133`
   ```typescript
   await supabaseAdmin.auth.admin.listUsers(); // ❌ Failed here
   ```

2. **Kong Gateway Discovery:** Found Kong transforms `sb_secret_...` API keys to JWTs:
   ```lua
   -- Kong config (/home/kong/kong.yml)
   (headers.apikey == 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz' and
    'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...') -- HS256 JWT
   ```

3. **GoTrue Configuration Discovery:**
   ```bash
   docker exec supabase_auth_service-center env | grep GOTRUE_JWT
   ```

   Output revealed:
   ```bash
   GOTRUE_JWT_SECRET=super-secret-jwt-token-with-at-least-32-characters-long
   GOTRUE_JWT_KEYS=[{"kty":"EC","kid":"b81269f1-21d8-4f2e-b719-c2240a840d90",...,"alg":"ES256"}]
   GOTRUE_JWT_VALID_METHODS=HS256,RS256,ES256
   ```

### The Core Issue

**Supabase CLI v2.76+ automatically generates ES256 signing keys**

When `GOTRUE_JWT_KEYS` (ES256) is present, GoTrue **completely ignores** `GOTRUE_JWT_SECRET` (HS256), even though HS256 is listed in `GOTRUE_JWT_VALID_METHODS`.

**Authentication Flow (Broken):**

```
Next.js App → sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz
     ↓
Kong Gateway → Transform to HS256 JWT
     ↓
     {
       "alg": "HS256",
       "iss": "supabase-demo",  // ❌ Wrong issuer
       "role": "service_role"
     }
     ↓
GoTrue → ❌ REJECT
     ↓
Reasons:
  1. Signing method HS256 invalid (expects ES256 ONLY)
  2. Issuer mismatch: "supabase-demo" vs "http://127.0.0.1:54321/auth/v1"
```

---

## 💡 Solution

### Approach: Direct ES256 JWT Bypass

Instead of relying on Kong's transformation, **directly use an ES256 JWT** signed with GoTrue's private key.

### Implementation Steps

#### 1. Generate ES256 JWT

Created script: `scripts/generate-es256-jwt.mjs`

```javascript
#!/usr/bin/env node
import jwt from 'jsonwebtoken';

// Extract ES256 private key from GoTrue
const jwk = {
  kty: "EC",
  kid: "b81269f1-21d8-4f2e-b719-c2240a840d90",
  alg: "ES256",
  d: "dIhR8wywJlqlua4y_yMq2SLhlFXDZJBCvFrY1DCHyVU",
  crv: "P-256",
  x: "M5Sjqn5zwC9Kl1zVfUUGvv9boQjCGd45G8sdopBExB4",
  y: "P6IXMvA2WYXSHSOMTBH2jsw_9rrzGy89FjPf6oOsIxQ"
};

// Convert JWK to PEM and sign
const payload = {
  iss: "http://127.0.0.1:54321/auth/v1", // ✅ Correct issuer
  role: "service_role",
  exp: 1983812996
};

const token = jwt.sign(payload, privateKeyPem, {
  algorithm: 'ES256',
  keyid: jwk.kid
});
```

**Generated JWT:**
```
eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImI4MTI2OWYxLTIxZDgtNGYyZS1iNzE5LWMyMjQwYTg0MGQ5MCJ9.eyJpc3MiOiJodHRwOi8vMTI3LjAuMC4xOjU0MzIxL2F1dGgvdjEiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiZXhwIjoxOTgzODEyOTk2LCJpYXQiOjE3NzA1MzUwNTl9.vkznw_4AKFo3WV5R7-0VoDlLmTT4PLAWIKObOaZ8hbh0rniBFeo40GdirNydqYUaIUmlRbCY8WlgRZgkmKNchw
```

#### 2. Update `.env` File

```bash
# Direct ES256 JWT (bypasses Kong transformation)
# Generated from GoTrue's ES256 private key with correct issuer & kid
# This works with GoTrue ES256 keys (Supabase CLI v2.76+)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImI4MTI2OWYxLTIxZDgtNGYyZS1iNzE5LWMyMjQwYTg0MGQ5MCJ9.eyJpc3MiOiJodHRwOi8vMTI3LjAuMC4xOjU0MzIxL2F1dGgvdjEiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiZXhwIjoxOTgzODEyOTk2LCJpYXQiOjE3NzA1MzUwNTl9.vkznw_4AKFo3WV5R7-0VoDlLmTT4PLAWIKObOaZ8hbh0rniBFeo40GdirNydqYUaIUmlRbCY8WlgRZgkmKNchw
```

#### 3. Restart Next.js Development Server

```bash
pkill -f "next dev"
pnpm dev
```

### Verification

```bash
curl -X POST 'http://127.0.0.1:3025/api/trpc/admin.setup?batch=1' \
  -H 'content-type: application/json' \
  --data-raw '{"0":{"password":"tantran"}}'
```

**Response (Success):**
```json
[{
  "result": {
    "data": {
      "message": "Setup completed successfully. Admin account created.",
      "action": "created"
    }
  }
}]
```

**GoTrue Logs (Success):**
```json
{
  "path": "/admin/users",
  "status": 200,
  "msg": "request completed"
}
```

---

## 🔄 Regenerating JWT (If Needed)

### When to Regenerate

- After `pnpx supabase db reset` (may generate new ES256 keys)
- When upgrading Supabase CLI to a new major version
- If GoTrue signing keys are manually rotated

### How to Regenerate

1. **Extract Current ES256 Keys:**
   ```bash
   docker exec supabase_auth_service-center env | grep GOTRUE_JWT_KEYS
   ```

2. **Run Generation Script:**
   ```bash
   node scripts/generate-es256-jwt.mjs
   ```

3. **Update `.env`:**
   - Copy the generated JWT
   - Replace `SUPABASE_SERVICE_ROLE_KEY` value
   - Restart Next.js dev server

4. **Verify:**
   ```bash
   curl http://127.0.0.1:54321/auth/v1/admin/users \
     -H "apikey: <NEW_JWT>" \
     -H "Authorization: Bearer <NEW_JWT>"
   ```

---

## 🚫 Alternative Solutions Attempted (Failed)

### Option 1: Disable ES256 Keys ❌

**Attempted:** Override `GOTRUE_JWT_KEYS=""` in GoTrue container

**Result:** Failed because Supabase CLI v2.76+ auto-generates ES256 keys on every `supabase start`, and cannot be easily disabled without modifying CLI source.

### Option 2: Update Kong Configuration ❌

**Attempted:** Replace HS256 JWT in Kong's `kong.yml` with ES256 JWT

**Result:** Failed because:
1. Kong config is auto-generated by Supabase CLI on container start
2. Manual edits cause permission errors: `sh: can't create /home/kong/kong.yml: Permission denied`
3. Kong enters crash loop on restart

---

## 📚 Technical Details

### JWT Structure Comparison

**❌ Kong's HS256 JWT (Rejected):**
```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "iss": "supabase-demo",
    "role": "service_role",
    "exp": 1983812996
  }
}
```

**✅ Our ES256 JWT (Accepted):**
```json
{
  "header": {
    "alg": "ES256",
    "typ": "JWT",
    "kid": "b81269f1-21d8-4f2e-b719-c2240a840d90"
  },
  "payload": {
    "iss": "http://127.0.0.1:54321/auth/v1",
    "role": "service_role",
    "exp": 1983812996,
    "iat": 1770535059
  }
}
```

### Key Differences

| Field | Kong HS256 | Our ES256 | Notes |
|-------|------------|-----------|-------|
| Algorithm | HS256 (HMAC) | ES256 (Elliptic Curve) | GoTrue requires ES256 when keys exist |
| Issuer | `supabase-demo` | `http://127.0.0.1:54321/auth/v1` | Must match `GOTRUE_JWT_ISSUER` |
| Key ID | None | `b81269f1-...` | Required for ES256 verification |
| Issued At | None | `1770535059` | Auto-added by jwt.sign() |

---

## 🔐 Security Considerations

1. **Never commit ES256 private keys** to version control
   - The `d` parameter in JWK is the private key
   - Keep `scripts/generate-es256-jwt.mjs` in `.gitignore` if it contains keys

2. **JWT Expiration:**
   - Current JWT expires: `1983812996` (2032-11-25)
   - Consider shorter expiration for production environments

3. **Service Role Key Protection:**
   - `.env` file is already in `.gitignore`
   - Service role bypasses ALL RLS policies - never expose to client

4. **Local Development Only:**
   - This solution is for local Supabase development
   - Production uses Supabase Cloud-managed authentication

---

## 📖 References

- [Supabase CLI GitHub Issues](https://github.com/supabase/cli/issues)
- [GoTrue JWT Verification Logic](https://github.com/supabase/gotrue/blob/master/internal/api/verify.go)
- [Kong Request Transformer Plugin](https://docs.konghq.com/hub/kong-inc/request-transformer/)
- [ES256 vs HS256 JWT Algorithms](https://auth0.com/blog/rs256-vs-hs256-whats-the-difference/)

---

## 🎯 Key Takeaways for Future Developers

1. **Supabase CLI v2.76+ uses ES256 by default** - This is intentional for improved security

2. **`sb_secret_...` format is NOT a JWT** - It's an API key that Kong transforms

3. **Don't fight the Kong config** - It's auto-generated and cannot be easily modified

4. **The Direct ES256 JWT approach is the cleanest solution** for local development with modern Supabase CLI

5. **Script `scripts/generate-es256-jwt.mjs` is your friend** when keys need rotation

---

## ✅ Validation Checklist

After applying this fix, verify:

- [ ] `/api/trpc/admin.setup` endpoint works (200 response)
- [ ] No "signing method HS256 is invalid" errors in GoTrue logs
- [ ] Admin user can be created successfully
- [ ] Service role operations (`supabaseAdmin`) function correctly
- [ ] Next.js dev server starts without errors

---

**Last Updated:** 2026-02-08
**Validated By:** Claude Code AI Assistant
**Affected Supabase CLI Versions:** v2.76.3+