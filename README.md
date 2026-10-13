# Personal Travel Agent

Next.js web application hosted on Vercel, with a protected MCP prototype endpoint.

## Implemented
- Google OAuth via NextAuth and read-only Gmail / Calendar search APIs (requires Google Cloud OAuth credentials).
- Flight candidate discovery; results must be manually confirmed.
- Traveler choice and four-column transportation comparison.
- Official DEN parking source check (prices unavailable if no reliably parsable current rate).
- RTD A Line date-specific timetable parser using official GTFS, disabled until RTD license terms are reviewed and accepted.
- Bearer-authenticated MCP JSON-RPC tools for transportation and RTD (not yet registered as a ChatGPT app).
- Vercel GitHub auto-deployment and Vercel Authentication for all deployments.

## Owner configuration required
1. Make GitHub repository **private** before storing personal details.
2. Create a Google Cloud OAuth web application; enable **Gmail API** and **Google Calendar API**. Add the exact authorized redirect URI:
   `https://travel-agent-smoky.vercel.app/api/auth/callback/google`
   Configure OAuth consent and add your own Google account as a test user where applicable.
3. In Vercel Environment Variables, set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` as encrypted values. `NEXTAUTH_URL` and `NEXTAUTH_SECRET` are configured in Vercel already.
4. Read the [RTD GTFS license](https://www.rtd-denver.com/open-records/open-spatial-information/gtfs). Only after agreeing, set `RTD_GTFS_LICENSE_ACCEPTED=true` in Vercel.
5. Redeploy after changing environment variables and sign in at the protected Vercel app.
6. The MCP endpoint requires `MCP_API_KEY`, set in Vercel, and an `Authorization: Bearer` header. This is **not** OAuth authorization for a ChatGPT custom app. ChatGPT app registration and per-user OAuth are separate unfinished work.

## Not yet available
- Verified live Uber/Lyft quotes: provider-approved quote API access is required. No quotes are fabricated.
- Exact trip timing: flight matching currently produces candidates rather than a verified itinerary; airport buffers and traffic feeds need implementation.
- RTD real-time predictions (GTFS-RT), which are different from published schedules.
- Embedded interactive ChatGPT MCP App UI and ChatGPT app registration.

## Development
```bash
npm install
npm run dev
npm run build
```

Legacy files `index.html` and `server.py` are prototypes and are not the Next.js production app.

## Security
Keep Vercel Authentication enabled for **all** deployments. Google tokens stay in encrypted HttpOnly session cookies. Do not put secrets, personal itineraries, or sensitive records in GitHub. The application makes no bookings or purchases.
