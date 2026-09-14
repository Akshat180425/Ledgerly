# Ledgerly Frontend

React, Vite, Tailwind CSS, and Recharts client for Ledgerly.

See the [project README](../README.md) for features, screenshots, local setup, and tests, and the [deployment guide](../DEPLOYMENT.md) for Vercel configuration and cookie-based API routing.

```bash
npm ci
npm run dev
```

The backend must be running separately. The development API proxy defaults to `http://localhost:8000`; use `.env.local` based on `.env.example` to override it.

Other commands: `npm run lint`, `npm run build`, and `npm run test:e2e`. Browser tests must run only against an isolated local backend.
