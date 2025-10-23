# 7. Infrastructure Leverage Summary

## Existing Supabase Services Available for Phase 2

Phase 2 benefits significantly from the **comprehensive Supabase local stack** already running in production via docker-compose.yml. The following services are readily available and should be leveraged:

| Service | Version | Phase 2 Usage | Implementation Notes |
|---------|---------|---------------|----------------------|
| **PostgreSQL** | 15.8.1.085 | Primary database for all new tables | Add 12 new tables via migrations |
| **Kong API Gateway** | 2.8.1 | Reverse proxy for all Supabase APIs | Rate limiting (NFR14) configured here |
| **GoTrue Auth** | v2.180.0 | User authentication (existing) + **SMTP for emails** | Reuse SMTP config for Phase 2 email notifications |
| **PostgREST** | v13.0.7 | Direct REST API access if needed | Can supplement tRPC for public endpoints |
| **Realtime** | v2.51.11 | **Optional**: Real-time task/stock updates | Alternative to polling, WebSocket subscriptions |
| **Storage API** | v1.28.0 | **Primary**: File uploads (photos, CSVs) | Create 3 new buckets: warehouse-photos, serial-photos, csv-imports |
| **imgproxy** | v3.8.0 | Image optimization for storage | Automatic resize/optimize uploaded photos |
| **Postgres-Meta** | v0.91.6 | Migration management | Used by `pnpx supabase migration up` |
| **Edge Functions** | v1.69.6 | **Optional**: Custom email sending | Alternative to GoTrue SMTP if more control needed |
| **Logflare Analytics** | 1.22.6 | Log aggregation and monitoring | All service logs available for debugging |
| **Studio** | 2025.10.01 | Database UI (port 3000) | Development and troubleshooting |
| **Vector** | 0.28.1 | Log collection from Docker | Streams to Logflare |

## Key Infrastructure Advantages

1. **No New Services Required**: All Phase 2 needs already satisfied by existing stack
2. **SMTP Already Configured**: Email notifications can use existing GoTrue SMTP credentials
3. **Storage Already Running**: File uploads work out-of-box with Supabase Storage SDK
4. **Real-time Optional**: Can upgrade from polling to WebSocket subscriptions without infrastructure changes
5. **Monitoring Built-in**: Logflare + Vector provide comprehensive logging without additional setup
6. **Zero Additional Deployment Complexity**: All services orchestrated by existing docker-compose.yml

## Recommended Service Utilization Strategy

**Phase 2 MVP (Required Services):**
- ✅ PostgreSQL - Core database (12 new tables)
- ✅ Kong - API Gateway (rate limiting for public portal)
- ✅ GoTrue - SMTP for email notifications
- ✅ Storage API - File uploads (photos, CSVs)
- ✅ imgproxy - Image optimization
- ✅ Postgres-Meta - Migrations

**Phase 2 Enhancements (Optional Services):**
- 🔄 Realtime - Upgrade from polling to WebSocket (Story 1.16+)
- 🔄 Edge Functions - Custom email templates (if GoTrue SMTP insufficient)
- 🔄 PostgREST - Public API alternative to tRPC (if needed)

**Always Available (Operational Services):**
- 📊 Studio - Development/debugging
- 📊 Logflare + Vector - Monitoring and logging

---

**End of PRD Document**

