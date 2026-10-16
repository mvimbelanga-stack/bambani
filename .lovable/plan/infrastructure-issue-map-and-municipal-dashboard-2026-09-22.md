# Infrastructure issue map and municipal dashboard

## Build
- Replace the current map screen with a full-width infrastructure map using mock interactive pins for stolen meters, missing boxes, and active assets.
- Add a clear red/yellow/green map legend and an Auto-Locate Me control that pins a simulated current location without calling external services.
- Overlay a bottom “Report Infrastructure Issue” panel with Stolen Meter, Unmetered/No Box, and Leak/Burst actions.
- Open a one-step verification panel for each report type showing mock GPS coordinates, a simulated photo upload, and a Dispatch Municipal Tech action.
- Add a top switch between Field Worker View and Municipal Revenue Dashboard, with loss estimate, stolen-meter, and dispatched-repair totals.
- Add smooth visual transitions and confirmation notifications while keeping every demo action local and free of external API calls.

## Validation
- Test the field report flow, location pinning, dashboard switch, and all map controls on phone and desktop sizes.
- Confirm the route renders without console errors and existing navigation still reaches it.
