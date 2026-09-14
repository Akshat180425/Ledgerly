# Deployment

This repository contains the frontend and backend source. A push to a connected branch may trigger Vercel and Render auto-deployments; it does not configure their environment variables or guarantee a successful release. Confirm both deployments after publishing changes.

## Existing Services

- Frontend: `https://ledgerly-five.vercel.app`
- Backend: `https://ledgerly-backend-m2uq.onrender.com`
- Vercel root directory: `frontend`; build command: `npm run build`; output: `dist`.
- Render root directory: `backend`; build command: `npm ci --omit=dev`; start command: `npm start`.
- Use Node.js 22.16 or newer for both services.

The checked-in `frontend/vercel.json` forwards `/api/*` to the existing Render backend and rewrites application routes to `index.html`. Update its backend URL if the service address changes. Keep the API rewrite ahead of the SPA fallback. This same-origin path is necessary for the new HTTP-only authentication cookies; the browser no longer stores JWTs in localStorage.

## Render Environment

| Variable | Value |
| --- | --- |
| MONGO_URI | Existing MongoDB connection string |
| JWT_SECRET | Cryptographically random secret, at least 32 characters |
| NODE_ENV | production |
| FRONTEND_URLS | https://ledgerly-five.vercel.app |
| GOOGLE_CLIENT_ID | Optional Google OAuth web client ID |
| TRUST_PROXY_HOPS | 1 by default; match your actual trusted proxy chain |
| PORT | Use Render's supplied value |

Multiple approved frontend origins can be comma-separated in `FRONTEND_URLS`. Use exact origins with no path. Add localhost origins only for development. Do not use a wildcard with cookie authentication. Preview deployments need their exact origin added before writes are accepted.

The API listens on `0.0.0.0` and waits for MongoDB and model indexes before starting. Health check path: `/api/v1/health`. Financial responses use `Cache-Control: no-store`.

## Google Sign-In

1. Create an OAuth client of type **Web application** in Google Cloud and configure its consent screen.
2. Add `https://ledgerly-five.vercel.app` and the local development origin to Authorized JavaScript origins.
3. Set the client ID in Render's `GOOGLE_CLIENT_ID` and restart/redeploy the backend.
4. The frontend fetches the public client ID from `/api/v1/auth/config`; no frontend rebuild or client secret is required for this setting.
5. Test a new Google account and an existing password account. Existing accounts must first sign in with a password, then connect the matching Google account in Settings.

Google credentials are verified server-side for signature, audience, issuer, expiry and verified email using Google's auth library. Account identity uses Google's `sub`. Existing email addresses are not silently linked.

Until configured, Google sign-in is unavailable and password authentication remains usable. The integration tests mock Google's verifier; live Google sign-in still requires a configured OAuth client and a real browser account.

## Recurring Transactions

Recurring dates use UTC. Daily/weekly/monthly/yearly schedules preserve their original anchor: a January 31 monthly schedule posts on February's last day, then March 31. Yearly February 29 schedules return to February 29 in leap years.

The backend checks due schedules on startup, every minute while running, and before finance API requests. Unique occurrence keys prevent duplicate income/expense entries across retries and concurrent runs. A maximum of 100 schedules is allowed per account. Catch-up is bounded to 400 occurrences per schedule per pass, so very long backlogs are completed in successive passes. Pausing retains the schedule; resuming catches up missed dates. Editing a schedule changes future amounts/labels only. Deleting it keeps previously posted transactions.

For posting when the web service is asleep, add a Render Cron Job using the same backend source and database environment. Command: `npm run recurring`; schedule: hourly or daily as needed. This is optional for request-time catch-up. No external scheduler was created by these changes.

## Data and Release Notes

- Existing income and expense records are retained. New collections are Budgets, Goals and Recurrings.
- Existing users will sign in again after release. Legacy localStorage credentials are removed, and the new API accepts the HTTP-only session cookie.
- Sessions expire after eight hours. Signing out revokes every existing session for that account.
- Coordinate frontend and backend deployment: the new client and cookie-based API must be released together.
- Password hashes and internal session fields are excluded from all auth responses.
- New photos are stored privately in MongoDB, avoiding Render's ephemeral filesystem. Existing PNG/JPEG upload URLs remain readable while their files exist; a photo re-upload is needed if the old files were lost during an earlier Render restart.
- Budgets are monthly. An overall budget and category budgets are independent and are not added together.
- Savings contributions earmark money and do not change the income-minus-expense balance. The latest 100 contributions are retained per goal.
- A currency change relabels amounts; it does not perform foreign-exchange conversion.
- Exports include the complete filtered result, up to 10,000 rows. Larger exports require a narrower date range.
- The ExcelJS UUID dependency is overridden to a compatible patched version; workbook export is covered by an integration test.
- Before release, preserve the existing database backup and confirm the production environment values. No production data was used for local testing.

## References

- [Vite routing on Vercel](https://vercel.com/docs/frameworks/frontend/vite)
- [Google ID token verification](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token)
- [Render web services](https://render.com/docs/web-services)
- [Render cron jobs](https://render.com/docs/cronjobs)
