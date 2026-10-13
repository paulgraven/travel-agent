# Personal Travel Agent — product specification

## What this project does

A mobile-friendly Denver airport transportation planner with a four-step experience:

1. **Find the relevant trip**. Select the next flight itinerary from user-authorized Gmail/Calendar, or use a fictional public demo. Hide unrelated calendar events. Normalize airport codes, local dates/times and duplicate flight evidence. Offer manual entry when data is incomplete.
2. **Who is traveling?** Just me, Two adults, Whole family, or Other. Use paying adult count for RTD. Young riders 19 and under ride free.
3. **Compare transportation**. Exactly four columns: Option, Est. round-trip cost, Est. time, Convenience. Options: Denver Economy parking, Uber/Lyft XL, Central Park RTD + A Line. No detailed timeline until user chooses.
4. **Show selected plan**. Outbound and return timeline, exact published RTD times only when licensed official GTFS data is verified. Otherwise clearly mark times unverified and link to provider.

No bookings, purchases, payments or unauthorized calendar changes.

## Public showcase and personal deployment

- **Public showcase** is a separate Vercel project built with NEXT_PUBLIC_SHOWCASE_ONLY=true.
- Public showcase contains fictional flight data only, no Google OAuth credentials or MCP secrets.
- Showcase middleware blocks OAuth, Gmail and MCP endpoints.
- **Private app** retains Vercel Authentication for all deployments and requires user Google consent.
- Keep real names, confirmation numbers, email addresses, family details, and actual itineraries out of the public repo.

## Accuracy

- Clearly distinguish published-rate estimates from live purchase quotes.
- DEN Economy parking rate: published $20/day. Confirm official current rate before purchase.
- RTD Airport fare: published $10 per paying adult each direction; riders 19 and under ride free. Central Park in-district parking first day free, $2/day afterward. Out-of-district charges differ.
- Uber/Lyft require approved API access for live prices, so offer links to providers and manual quote entry without inventing current rates.
- RTD A Line departures require a verified published schedule effective on the selected date; holiday exceptions and unknown dates fail closed.
- Flight evidence from Gmail/Calendar may be incomplete or outdated. Ask user to confirm itinerary.

## Architecture

Next.js 15 + React, NextAuth Google OAuth, Gmail/Calendar read-only APIs, server-side flight extraction and deduplication, published-price calculations, official A Line timetable parser, with date and holiday safeguards, bearer-key MCP JSON-RPC prototype, Vercel Git deployment, Node regression tests. Legacy index.html and server.py are not used in production.

## Release criteria

- npm test and npm run build pass.
- Browser demo: pick trip, choose travelers, compare all 4 columns, select transport, then show selected plan. Mobile no horizontal overflow.
- Private deployment Vercel Authentication all; public build with no secrets and private API blocked.
- Both Vercel production deployments READY on final commit.

## Honest limitations

Unusual airline emails may not parse; there's no live flight status integration. Ground-route timing requires traffic data. No Uber/Lyft price API is connected. RTD timetable verification excludes uncertain holidays and dates outside the official schedule period. The MCP endpoint is not yet a registered OAuth-capable ChatGPT custom app or embedded MCP App UI. This is an interactive showcase, not a universal booking platform.
