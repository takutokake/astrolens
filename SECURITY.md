# Security Hardening Documentation

## Overview

This application has been hardened following **OWASP Top 10** best practices and industry security standards.

## Security Measures Implemented

### 1. Rate Limiting (OWASP A04:2021 - Insecure Design)

**Implementation:** `src/lib/rate-limit.ts`

#### Features:
- **Dual-layer rate limiting**: User ID + IP address
- **Stricter limits for unauthenticated requests**
- **IP address hashing** (SHA-256) for GDPR compliance
- **Graceful 429 responses** with retry-after headers
- **Per-endpoint configuration**

#### Rate Limits:

| Endpoint | Authenticated | IP-Only | Window |
|----------|--------------|---------|--------|
| `/api/news` | 30 req/min | 10 req/min | 1 min |
| `/api/digest` | 10 req/hour | 3 req/hour | 1 hour |
| `/api/tts` | 5 req/day | 2 req/day | 24 hours |
| `/api/saved` | 60 req/min | 20 req/min | 1 min |
| `/api/interactions` | 60 req/min | 20 req/min | 1 min |
| `/api/user` | 30 req/min | 10 req/min | 1 min |
| `/api/generate-radio-script` | 10 req/hour | 2 req/hour | 1 hour |
| `/api/force-refresh` | 5 req/hour | 1 req/hour | 1 hour |
| `/api/cron/fetch-news` | 100 req/hour | 1 req/hour | 1 hour |

#### IP Extraction:
Supports multiple proxy configurations:
- `X-Real-IP`
- `X-Forwarded-For`
- `CF-Connecting-IP` (Cloudflare)
- `X-Vercel-Forwarded-For` (Vercel)

### 2. Input Validation & Sanitization (OWASP A03:2021 - Injection)

**Implementation:** `src/lib/validations.ts`

#### Features:
- **Schema-based validation** using Zod
- **Strict type checking**
- **Length limits** to prevent DoS
- **Whitelist-based validation** (enums)
- **Reject unexpected fields** with `.strict()`
- **XSS prevention** via string sanitization
- **UUID format validation**

#### Sanitization Rules:
```typescript
// String sanitization
- Trim whitespace
- Remove HTML tags (<, >)
- Hard limit: 1000 characters
- Country/language codes: exactly 2 characters
- Keywords: max 50 characters
```

#### Validation Schemas:
- `digestRequestSchema` - Orbit creation
- `preferencesSchema` - User settings
- `savedArticleSchema` - Article bookmarking
- `interactionSchema` - User interactions
- `ttsRequestSchema` - Audio generation
- `radioScriptRequestSchema` - Script generation
- `cronSecretSchema` - Cron authentication

### 3. Secure API Key Management (OWASP A07:2021 - Identification and Authentication Failures)

#### Server-Side Only:
✅ All API keys stored in environment variables  
✅ Never exposed to client-side code  
✅ Not committed to version control  

#### API Keys Used:
```bash
# Server-side only (NEVER exposed to client)
SUPABASE_SERVICE_ROLE_KEY=...
NEWSDATA_API_KEY=...
OPENAI_API_KEY=...
GOOGLE_TTS_API_KEY=...
CRON_SECRET=...

# Client-side (safe to expose)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

#### Key Rotation:
- Rotate `CRON_SECRET` monthly
- Rotate `OPENAI_API_KEY` quarterly
- Monitor API usage for anomalies

### 4. Authentication & Authorization (OWASP A01:2021 - Broken Access Control)

#### Features:
- **Supabase Auth** for user authentication
- **Row Level Security (RLS)** in database
- **User ownership verification** on all endpoints
- **Session-based authentication**

#### Access Control:
```typescript
// All protected endpoints verify:
1. User is authenticated
2. User owns the resource (digest, saved article, etc.)
3. Rate limits are not exceeded
```

### 5. Security Headers

**Recommended middleware configuration:**

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // SECURITY: Set security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  );
  
  return response;
}
```

### 6. Database Security

#### Supabase RLS Policies:
- Users can only read/write their own data
- Articles are publicly readable
- Digests, saved articles, interactions are user-scoped
- Service role bypasses RLS for admin operations

#### SQL Injection Prevention:
- Parameterized queries via Supabase client
- No raw SQL from user input
- UUID validation prevents injection

### 7. Error Handling

#### Secure Error Messages:
```typescript
// ❌ BAD - Exposes internal details
{ error: "Database connection failed: postgres://..." }

// ✅ GOOD - Generic message
{ error: "Internal server error" }
```

#### Logging:
- Errors logged server-side only
- No sensitive data in logs
- Stack traces never sent to client

## Security Checklist

### Pre-Deployment:
- [ ] All API keys in environment variables
- [ ] `.env.local` in `.gitignore`
- [ ] Rate limits configured appropriately
- [ ] Input validation on all endpoints
- [ ] Security headers enabled
- [ ] HTTPS enforced in production
- [ ] CORS configured properly
- [ ] Database RLS policies active

### Post-Deployment:
- [ ] Monitor rate limit violations
- [ ] Review API usage logs
- [ ] Rotate secrets regularly
- [ ] Update dependencies monthly
- [ ] Run security audits quarterly

## Vulnerability Reporting

If you discover a security vulnerability, please email: security@astrolens.app

**Do NOT** create public GitHub issues for security vulnerabilities.

## OWASP Top 10 Coverage

| Risk | Status | Implementation |
|------|--------|----------------|
| A01:2021 - Broken Access Control | ✅ | RLS + ownership checks |
| A02:2021 - Cryptographic Failures | ✅ | HTTPS, hashed IPs |
| A03:2021 - Injection | ✅ | Input validation, parameterized queries |
| A04:2021 - Insecure Design | ✅ | Rate limiting, defense in depth |
| A05:2021 - Security Misconfiguration | ✅ | Security headers, secure defaults |
| A06:2021 - Vulnerable Components | ⚠️ | Regular dependency updates needed |
| A07:2021 - Auth Failures | ✅ | Supabase Auth, session management |
| A08:2021 - Data Integrity Failures | ✅ | Input validation, type safety |
| A09:2021 - Logging Failures | ⚠️ | Basic logging (enhance monitoring) |
| A10:2021 - SSRF | ✅ | No user-controlled URLs |

## Security Testing

### Manual Testing:
```bash
# Test rate limiting
for i in {1..50}; do curl http://localhost:3000/api/news; done

# Test input validation
curl -X POST http://localhost:3000/api/digest \
  -H "Content-Type: application/json" \
  -d '{"duration": 999, "categories": ["invalid"]}'

# Test authentication
curl http://localhost:3000/api/news  # Should return 401
```

### Automated Testing:
```bash
# Install OWASP ZAP for security scanning
npm install -g zaproxy

# Run security scan
zap-cli quick-scan http://localhost:3000
```

## Compliance

### GDPR:
- IP addresses hashed (SHA-256)
- User data scoped by RLS
- Data deletion on account removal

### CCPA:
- User data export available
- Data deletion on request
- No data selling

## Incident Response

### If Compromised:
1. **Immediately** rotate all API keys
2. Invalidate all user sessions
3. Review access logs
4. Notify affected users
5. Patch vulnerability
6. Document incident

## Security Updates

Last security audit: 2026-03-21  
Next scheduled audit: 2026-06-21

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/configuring/security)
- [Supabase Security](https://supabase.com/docs/guides/platform/security)
