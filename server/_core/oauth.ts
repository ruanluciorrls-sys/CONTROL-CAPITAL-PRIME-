import type { Express } from "express";

// OAuth routes — disabled after migration to standalone auth
// The /api/oauth/callback route is no longer used.
// Login is now done via trpc.auth.login (email + password).
export function registerOAuthRoutes(_app: Express) {
  // No-op: kept for backwards compatibility with server entry point import
}
