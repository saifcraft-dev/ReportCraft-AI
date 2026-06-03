---
name: PRD audit v3 gaps
description: All gaps found and fixed during the full PRD v3.0 audit — error codes, encryption, routes, webhook events, ReportPreview controls.
---

# PRD v3.0 Audit — Gaps Fixed

**Why:** Full codebase audit vs PRD — documents non-obvious decisions for future consistency.

## Error code: ACCOUNT_READ_ONLY (not READ_ONLY_MODE)
- `readonly.middleware.ts` must return `error: 'ACCOUNT_READ_ONLY'` (PRD §11)
- Was: `READ_ONLY_MODE` — fixed all 3 occurrences

## GET /api/reports/:id must include agency
- The `agency` relation must be included (select: name, brandColor, logoUrl, narrativeTone)
- Without it, ReportPreview falls back to default brandColor `#6366F1` — the agency branding never shows

## ENCRYPTION_KEY — 64-char hex support
- PRD §5.3 specifies the key as a 64-char hex string (= 32 bytes)
- `encryption.ts` now detects `/^[0-9a-fA-F]{64}$/` and uses `Buffer.from(key, 'hex')`
- Shorter/non-hex strings fall back to utf8 padded to 32 chars (backward compat)
- Dev-only default key logs a console.error in production

## Missing route: /clients/new
- App.tsx was missing this route (PRD §9)
- Added `NewClient.tsx` page at `client/src/features/clients/pages/NewClient.tsx`
- On success, redirects to `/clients/:id`; on CLIENT_LIMIT_EXCEEDED shows UpgradeModal

## ReportPreview sidebar additions (PRD §6.3)
- Added `ToneSelector` segmented control (professional / conversational / executive)
  - Calls `reportsApi.regenerate(id, newTone)` when changed
- Added `DateRangeSelector` with 7d / 30d / 90d presets + custom date pickers
  - Creates a NEW report via `reportsApi.create(...)` then navigates to the new report
- Renamed "Regenerate AI" → "Refresh Data" (same endpoint; clearer intent)
- Sidebar now also shows date range and aiModel in Info section

## Webhook: order_refunded
- Added `order_refunded` Lemon Squeezy event → sets `subscriptionStatus: 'cancelled'`, `subscriptionTier: 'FREE_TRIAL'`

## .env.example files
- Both `server/.env.example` and `client/.env.example` already existed; updated ENCRYPTION_KEY comment to say "64-char hex, generate with openssl rand -hex 32"

## Schema indexes — all present
- All PRD §13.2 indexes are in the schema: Client[agencyId], Client[agencyId,archivedAt], OAuthToken[agencyId,status], Report compound indexes, ReportDelivery[clientId,agencyId], TeamMember[agencyId,role]

## Stale report cleanup — already implemented
- `startStaleReportCleanup()` is called in `index.ts` on startup; resets generating reports older than 35s to error
