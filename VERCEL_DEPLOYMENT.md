# Vercel deployment

The frontend and Express HTTP API deploy together. Production requests default
to `/api`; development continues to use `http://localhost:4000`. An explicit
`VITE_API_URL` may still target a separately hosted backend.

`vercel.json` builds the server and frontend, then routes `/api/*` to
`api/index.js` before the SPA fallback. The API entry point exports Express
without starting a persistent listener.

Configure `FIREBASE_PROJECT_ID` and `FIREBASE_SERVICE_ACCOUNT` in Vercel. The
latter must be a sensitive, server-only variable containing the service account
JSON. Never prefix credentials with `VITE_` or commit downloaded key files.
Keep `JWT_SECRET` and the other backend settings described in
`server/.env.example` configured for the features in use. Set `PUBLIC_BASE_URL`
to the production website for checkout and authentication redirects.

Verify `/api/health` returns JSON, `/api/rooms` returns the active catalogue,
and anonymous `/api/admin/rooms` requests return 401. Check the room listing
and direct room detail links after deployment.

Vercel Functions do not host the standalone Socket.io server. Socket connections
are disabled for the same-origin API, while stored notifications remain available
over HTTP. Use a separately hosted backend with `VITE_API_URL` to enable sockets.
