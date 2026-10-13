# Personal Travel Agent — product and integration specification

## Status
This repository contains a **simulation/prototype**. The full product is **not complete**. No booking, payment, live Gmail/Calendar, live fares, RTD verification, hosted authenticated MCP endpoint, or ChatGPT embedded app is operational.

## Required interaction contract
1. Discover upcoming flights from user-authorized Gmail and Google Calendar. Normalize itinerary and show airline, flight number, airport codes, dates, local departure/arrival times, travelers, and source provenance. Never treat inferred flights as confirmed.
2. Ask **Who’s traveling?** Choices: **Just me**, **Whitney and me**, **Whole family including Izzy and Emma**, **Other**. Do not advance until selected.
3. Show only this four-column comparison: **Option | Est. round-trip cost | Est. time | Convenience**. Rows: **DEN Economy parking**, **Uber/Lyft XL combined**, **Central Park RTD parking + A Line**. Time is one-way. Price is round-trip. Include parking eligibility and car seats/luggage constraints. Identify estimates and source freshness; never invent live prices.
4. Ask for a transportation selection. Do not show the detailed schedule before this step.
5. Show concise outbound and return schedules only for selected option, anchored to verified flight local times and realistic buffers.
6. For RTD, verify **date-specific** A Line service day, exact Central Park departure and DEN arrival outbound, DEN departure and Central Park arrival return against authoritative timetable. Distinguish published schedules from real-time service. If unable to verify any time, explicitly mark unverified; do not fabricate it. Check in-district parking eligibility separately.
7. Simulation must never make bookings or purchases. Actual bookings require explicit authorization and confirmation.

## Architecture target
- Responsive web app (Vercel), protected with authenticated access.
- Hosted MCP server over HTTPS with authenticated tools and an embedded MCP App UI, sharing the same business rules as web UI.
- OAuth for Google Gmail/Calendar with least privilege, explicit user consent, encrypted token storage, revoke/disconnect support.
- Providers for parking rates, rideshare quotes, RTD schedule, and traffic; gracefully mark data unavailable.
- Durable trip/session state machine so ChatGPT cannot skip the required gates.
- Automated tests for transitions, cost/time column contract, source attribution, RTD timetable refusal, and access control.
- GitHub-to-Vercel auto-deployment from main, only after deployment protection is confirmed.

## Security
Repository currently PUBLIC as observed October 13, 2026. Keep it free of personal itineraries, family data, credentials, tokens and private addresses. Turn it PRIVATE before personal data is added. X-Robots-Tag and robots.txt are not access controls. Vercel deployment protection must be independently verified. Never expose MCP endpoints without auth.

## Completion criteria
Web app and ChatGPT UI both reproduce all stages reliably, authorized flights populate automatically, external costs/schedules are verified or labeled unknown, protected deployments pass an unauthorized access test, and a test itinerary passes end-to-end.
