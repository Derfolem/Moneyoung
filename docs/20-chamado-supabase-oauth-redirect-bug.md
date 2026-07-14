Project ref: cohiqclhebywnzmcznoc

Subject: OAuth `redirect_to` is ignored — always falls back to Site URL, even for exact allow-listed entries and wildcard patterns

## Summary

Google OAuth sign-in via `signInWithOAuth` never redirects to the `redirect_to` value passed in the request, even when that exact value is present in Authentication → URL Configuration → Redirect URLs. GoTrue always falls back to the Site URL (`http://localhost:8081`) instead, regardless of what is configured in the allow list.

This breaks native app sign-in entirely (custom URL scheme `moneyoung://auth/callback`), since the browser tries to load `http://localhost:8081` on the mobile device, which is unreachable there.

## Expected behavior

When calling:
```
GET /auth/v1/authorize?provider=google&redirect_to=moneyoung%3A%2F%2Fauth%2Fcallback
```
and completing the Google login, GoTrue's `/auth/v1/callback` should redirect the browser to `moneyoung://auth/callback?code=...` (PKCE flow), since `moneyoung://auth/callback` is present verbatim in the project's Redirect URLs allow list.

## Actual behavior

`/auth/v1/callback` always redirects to `http://localhost:8081/#access_token=...` (the Site URL), discarding the requested `redirect_to` entirely — for every value tested, not just the custom scheme.

## Steps to reproduce

1. In Authentication → URL Configuration, confirm `moneyoung://auth/callback` is listed under Redirect URLs (it is, verbatim, alongside a wildcard variant `moneyoung://auth/callback/**` added later for testing).
2. Call `GET https://cohiqclhebywnzmcznoc.supabase.co/auth/v1/authorize?provider=google&redirect_to=moneyoung%3A%2F%2Fauth%2Fcallback`.
3. Complete Google sign-in.
4. Observe the final browser redirect lands on `http://localhost:8081/#access_token=...` instead of `moneyoung://auth/callback?code=...`.

## Evidence this is not a config mistake

We tested exhaustively over roughly 3 hours, with log evidence for each attempt (available via Supabase's own `auth` log explorer for this project, timestamps below in UTC):

1. **Exact match already in allow list** (`moneyoung://auth/callback`) — fails. `/authorize` logs correctly show `referer: "moneyoung://auth/callback"`, but the subsequent `/callback` always logs `referer: "http://localhost:8081"`.
2. **A second, unrelated exact-match entry that was already in the list before this issue** (`http://localhost:3000/login`) — also fails the same way. This rules out anything specific to custom URL schemes; the allow list appears to not be applied at all, for any non-Site-URL value.
3. **Added a wildcard variant** (`moneyoung://auth/callback/**`) — same failure.
4. **Forced a config reload** by re-saving the Site URL field twice (no value change). Logs confirm `"msg":"reloading api with new configuration"` fired twice, at `2026-07-14T12:12:18Z` and `2026-07-14T12:12:29Z`. Behavior unchanged after reload.
5. **Full project restart** via Project Settings. Logs confirm GoTrue fully restarted (`"msg":"GoTrue API started on: localhost:9999"` at `2026-07-14T12:25:44Z`, replacing the prior instance that had been running since `2026-07-13T22:12:49Z`). Behavior unchanged after restart.
6. **Disabled and re-enabled the Google provider** in Authentication → Providers. Behavior unchanged.
7. **Tested with two different Google accounts**, from a fully cleared browser/app state each time (no cached session). Both fail identically — confirmed via `auth_event` log entries for `ofrutofredmelo@gmail.com` (e.g. `2026-07-14T13:22:49Z`) and `agentcodi01@gmail.com` (e.g. `2026-07-14T13:29:53Z`).
8. Confirmed the project ref used in testing (`cohiqclhebywnzmcznoc`) matches the project ref in the dashboard URL being edited — no cross-project confusion.
9. **Added trailing-slash variants** to rule out normalization/tokenization mismatches in the allow-list matcher: `moneyoung://auth/callback/`, `moneyoung://auth/callback/*`, `http://localhost:3000/login/`, `http://localhost:3000/login/*` (kept alongside all prior entries, none removed). Repeated the full OAuth flow end-to-end with a real Google login (`ofrutofredmelo@gmail.com`, fully reset emulator + wiped app/browser state) at `2026-07-14T14:04:37Z`–`14:04:38Z`. `/authorize` again logged the correct `referer: "moneyoung://auth/callback"`, but `/callback` again resolved to `http://localhost:8081` — identical failure, no change from the trailing-slash variants either.

## Current URL Configuration (for reference)

Site URL: `http://localhost:8081`

Redirect URLs:
- `http://localhost:8081/**`
- `http://localhost:3000/**`
- `moneyoung://auth/callback`
- `moneyoung://auth/callback/**` (added during troubleshooting)
- `moneyoung://auth/callback/` (added during troubleshooting)
- `moneyoung://auth/callback/*` (added during troubleshooting)
- `https://mygbank.vercel.app/**`
- `https://mygbank.vercel.app/login`
- `http://localhost:3000/login`
- `http://localhost:3000/login/` (added during troubleshooting)
- `http://localhost:3000/login/*` (added during troubleshooting)
- `https://admin.moneyoung.com/**`

## Additional context

- This project may have been auto-paused due to ~5-6 days of inactivity and resumed around `2026-07-13T22:12:49Z` (the first GoTrue startup timestamp we observed in logs this week). We suspect the pause/resume cycle may have left the Auth service's URL Configuration in a stale or partially-applied state, though a subsequent full restart (see point 5 above) did not resolve it.
- This is currently blocking all Google sign-in for our production mobile app (Expo/React Native, `apps/mobile`), and potentially any other client (web-admin panel) whose `redirectTo` differs from the Site URL.

Please advise on how to get the Redirect URLs allow list actually applied, or whether this requires a deeper fix on your end.

Thank you.
