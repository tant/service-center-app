# Fixes & Troubleshooting Documentation

This directory contains detailed documentation of issues encountered during development and their solutions.

## 📑 Index

### Authentication & Authorization

- **[GoTrue ES256 JWT Authentication Issue](./gotrue-es256-jwt-authentication.md)** (2026-02-08)
  - **Problem:** Service role operations failing with "signing method HS256 is invalid"
  - **Root Cause:** Supabase CLI v2.76+ uses ES256 keys, incompatible with Kong's HS256 transformation
  - **Solution:** Direct ES256 JWT bypass using `scripts/generate-es256-jwt.mjs`
  - **Severity:** Critical
  - **Status:** ✅ Resolved

---

## 🎯 How to Use This Documentation

1. **When encountering an error:**
   - Search this directory for similar error messages
   - Check the symptoms section of each document
   - Follow the solution steps exactly as written

2. **Before making infrastructure changes:**
   - Review relevant documents to understand implications
   - Check if similar issues have been solved before
   - Document new issues following the same format

3. **Document Template:**
   ```markdown
   # Title of Issue

   **Date:** YYYY-MM-DD
   **Severity:** Critical/High/Medium/Low
   **Status:** Resolved/Open/Investigating
   **Affected Components:** List components

   ## Problem Summary
   [Brief description and symptoms]

   ## Root Cause Analysis
   [Detailed investigation and findings]

   ## Solution
   [Step-by-step fix with code examples]

   ## References
   [Links to related documentation]
   ```

---

## 🔍 Quick Reference

### Common Error Patterns

| Error Message | Document | Quick Fix |
|---------------|----------|-----------|
| `signing method HS256 is invalid` | [gotrue-es256-jwt-authentication.md](./gotrue-es256-jwt-authentication.md) | Use ES256 JWT in `.env` |
| `fetch failed` (auth) | [gotrue-es256-jwt-authentication.md](./gotrue-es256-jwt-authentication.md) | Check service role JWT validity |

---

## 📝 Contributing

When adding new fix documentation:

1. Use the template format above
2. Include complete error messages and logs
3. Document the investigation process
4. Provide step-by-step solutions
5. Add verification steps
6. Update this README index
7. Use descriptive filenames (kebab-case)

---

**Last Updated:** 2026-02-08
