# Personal Travel Agent

A polished, responsive interactive app demonstrating how flight confirmations can turn into a useful airport transportation plan.

**Experience:** select a trip → choose travelers → compare round-trip options → receive a transport-specific outbound and return timeline.

## Try it

- [Public employer showcase](https://travel-agent-showcase-gravenpaul-2504s-projects.vercel.app) — fictional itinerary, no Google connection or private credentials.
- [Private Google-connected app](https://travel-agent-smoky.vercel.app) — Vercel-authenticated; Google OAuth consent required.

The public showcase is intended for anyone to try. It is separate from the private application; its deployed environment has only NEXT_PUBLIC_SHOWCASE_ONLY=true and no Google credentials, and middleware rejects Calendar/Auth/MCP APIs.

## What works

- Next.js responsive design with four-step guided trip flow and manual entry.
- Flight grouping and deduplication from Google Calendar, across accessible calendars with pagination (read-only user consent required). Time-zone normalization for common airport codes.
- Date/time prepopulation from selected trip and traveler-aware RTD fares.
- DEN Economy parking and RTD A Line published-rate transportation estimates with references and clearly stated assumptions.
- Provider handoff and manual round-trip quote entry for Uber/Lyft XL.
- Official A Line schedule verification for supported dates with holiday safeguards.
- Bearer-protected experimental MCP JSON-RPC endpoint in the **private** deployment; not yet a registered ChatGPT App.
- Vercel Git auto-deploy for private and public environments, Node tests and GitHub CI.

## Intentional limitations

- Live Uber/Lyft quotes are **not** available without provider-approved API access; the app will not fabricate them.
- Precise vehicle trip times require live map traffic; only planning targets are shown.
- RTD schedule times are retrieved from the official A Line timetable with service-day and effective-period validation; unverified dates are flagged, never invented.
- Flight parsing is best-effort and requires itinerary confirmation; provider flight-status feeds are not connected.
- ChatGPT custom app registration and OAuth for MCP tool authorization are separate unfinished integrations.

## Development

Install Node.js 22 or newer and run:

    npm install
    npm test
    npm run dev
    npm run build

Deployment uses Next.js. Legacy index.html and server.py are historical prototypes.

## Google OAuth for private deployment

Enable Google Calendar API in Google Cloud and configure Google OAuth Web Application redirect URI:

    https://travel-agent-smoky.vercel.app/api/auth/callback/google

Set Vercel environment variables GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, NEXTAUTH_URL and NEXTAUTH_SECRET. Keep credentials in Vercel, never in GitHub.

## Portfolio and security

Public demo flights are entirely fictional. Private deploys are protected by Vercel Authentication, and the public demo has no Google secrets. Real booking numbers, user emails, home addresses and flight confirmations are not stored in this repository. Never copy production secrets into demo deployment. Google read-only scopes are sensitive/restricted and broader public distribution may require Google verification.

## October 13 Calendar-only rebuild
- Google OAuth requests Calendar read-only, never Gmail. No Gmail API calls.
- Scans calendar lists and event pagination; failed calendars produce warnings.
- Full selected-mode schedules, terminal walk and baggage buffers, conditional lounge goal.
- User-entered drive minutes; no invented live traffic.
- Official DEN/RTD rate sources checked at runtime; failed checks explicitly label saved estimates.
- RTD effective-period and service-day verification; date-specific exceptions explicitly unverified.
- In-district Central Park parking default; one seat per child, checked bags, stroller, XL capacity check.
- Copy includes full schedule; /privacy explains data use and revocation.

Release blockers for unrestricted multi-user production: Google consent-screen publishing/verification has not been inspected; production OAuth round trip needs a user-authorized login; Uber/Lyft provider credentials are absent; live driving/flight-status integrations are absent. Production visitors can access the planner and use Google sign-in; preview deployments retain Vercel protection. Do not describe this as fully production-ready until those external requirements pass.

## Traffic integration and external release requirements
The /api/traffic endpoint calls the official Google Maps Routes API using a server-only GOOGLE_MAPS_API_KEY. It requires a signed-in session and same-origin POST; the fictional showcase cannot incur traffic requests. The address is transmitted only by the visitor's explicit Check traffic action. Current estimates and future traffic forecasts have distinct labels. Without credentials it makes no provider call and reports unavailable.

To activate: enable Routes API in the owner's Google Cloud project with billing and approved quotas; store a Routes-restricted key as a production Secret in Vercel. Do not paste keys into chat or put them in NEXT_PUBLIC variables. Redeploy, then run the authenticated acceptance test.

Uber's standard Price Estimates API requires approval and explicitly prohibits competitive third-party price comparisons: https://developer.uber.com/docs/riders/references/api/v1.2/estimates-price-get . Automatic Uber/Lyft comparison therefore requires separately authorized provider access that permits this use; no scraper or unauthorized endpoint is used. Provider app handoffs remain available. This release does not activate live fare access.

Google login acceptance: sign in, grant Calendar-only permissions, confirm a real itinerary, select travelers, verify three comparison rows, select RTD, check published trains, sign out, and confirm /api/flights returns 401. Repeat with a second Google account to prove isolation. Our automated browser cannot reach accounts.google.com (connection refused); actual Google login/public consent remains unverified.

## Simplified traveler-first interface
The main app opens with one Continue with Google button. Returning signed-in users see discovered flights and the traveler question immediately. The comparison has exactly four columns; outbound/return schedules appear only after transportation is selected. Dashboard panels and the stepper are removed, with corrections and optional controls folded into details. Google signIn('google') skips the intermediary provider page. Normal sign-in no longer forces prompt=consent; explicit reconnect can request fresh consent after authorization failure. Google can still require permission or verification according to the OAuth client's status.
