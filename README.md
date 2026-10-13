# Personal Travel Agent

A polished, responsive interactive app demonstrating how flight confirmations can turn into a useful airport transportation plan.

**Experience:** select a trip → choose travelers → compare round-trip options → receive a transport-specific outbound and return timeline.

## Try it

- [Public employer showcase](https://travel-agent-showcase-gravenpaul-2504s-projects.vercel.app) — fictional itinerary, no Google connection or private credentials.
- [Private Google-connected app](https://travel-agent-smoky.vercel.app) — Vercel-authenticated; Google OAuth consent required.

The public showcase is intended for anyone to try. It is separate from the private application; its deployed environment has only NEXT_PUBLIC_SHOWCASE_ONLY=true and no Google credentials, and middleware rejects Gmail/Auth/MCP APIs.

## What works

- Next.js responsive design with four-step guided trip flow and manual entry.
- Flight grouping and deduplication from Google Calendar, plus airline-email confirmation extraction from Gmail (user consent required). Time-zone normalization for common airport codes.
- Date/time prepopulation from selected trip and traveler-aware RTD fares.
- DEN Economy parking and RTD A Line published-rate transportation estimates with references and clearly stated assumptions.
- Provider handoff and manual round-trip quote entry for Uber/Lyft XL.
- Date-specific RTD schedule parser guarded by explicit GTFS license acceptance.
- Bearer-protected experimental MCP JSON-RPC endpoint in the **private** deployment; not yet a registered ChatGPT App.
- Vercel Git auto-deploy for private and public environments, Node tests and GitHub CI.

## Intentional limitations

- Live Uber/Lyft quotes are **not** available without provider-approved API access; the app will not fabricate them.
- Precise vehicle trip times require live map traffic; only planning targets are shown.
- Date-specific RTD schedule requires the owner to review and accept the RTD GTFS license, then configure RTD_GTFS_LICENSE_ACCEPTED=true on the private Vercel project; no times are invented when feed data is unavailable.
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

Enable Gmail API and Google Calendar API in Google Cloud and configure Google OAuth Web Application redirect URI:

    https://travel-agent-smoky.vercel.app/api/auth/callback/google

Set Vercel environment variables GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, NEXTAUTH_URL and NEXTAUTH_SECRET. Keep credentials in Vercel, never in GitHub.

## Portfolio and security

Public demo flights are entirely fictional. Private deploys are protected by Vercel Authentication, and the public demo has no Google secrets. Real booking numbers, user emails, home addresses and flight confirmations are not stored in this repository. Never copy production secrets into demo deployment. Google read-only scopes are sensitive/restricted and broader public distribution may require Google verification.
