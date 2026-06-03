---
name: Global upgrade modal pattern
description: How ACCOUNT_READ_ONLY and similar 403 errors surface the UpgradeModal from anywhere in the app
---

## Rule
When the API returns a 403 with `error: 'ACCOUNT_READ_ONLY'`, `'FEATURE_LOCKED'`, or `'REPORT_LIMIT_REACHED'`, dispatch a `CustomEvent('show-upgrade-modal', { detail: { reason } })` on `window`. The `AppShell` in `ProtectedLayout.tsx` listens for this event and renders `UpgradeModal`.

**Why:** Avoids prop-drilling the modal state through every page/component. Any API call anywhere in the app will automatically trigger the upgrade prompt.

**How to apply:**
- `reason` maps to `UpgradeModal`'s `reason` prop: `'trial_expired' | 'client_limit' | 'report_limit' | 'feature_locked'`
- The mapping lives in `client/src/lib/api.ts` response interceptor
- `UpgradeModal` already fires `upgrade_clicked` PostHog event when user clicks "View Plans"
- For share-link specifically: `PUT /reports/:id/share` returns `FEATURE_LOCKED` when tier is not `AGENCY_PRO`
