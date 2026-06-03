---
name: Backend workflow recovery
description: How to fix the Backend Server workflow when it shows as "failed" in Replit
---

The `restart_workflow()` tool consistently times out for the Backend Server with "didn't open port 8000" — even though the server starts fine (confirmed via bash).

**Why:** The workflow tool's port detection fails when the workflow is in a stale "failed" state. The server does open port 8000 correctly but the Replit workflow runner doesn't detect it during a restart cycle.

**How to apply:** When the Backend Server workflow shows as "failed", use `configureWorkflow()` instead:

```javascript
await configureWorkflow({
  name: "Backend Server",
  command: "cd server && npx prisma generate && npx tsx src/index.ts",
  waitForPort: 8000,
  outputType: "console",
  autoStart: true
});
```

This resets the workflow state and starts it fresh. Do NOT use `restart_workflow()` for the backend — it will always time out.
