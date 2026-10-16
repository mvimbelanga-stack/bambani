# World Crime Unicorn — mobile-first crime-fighting app

A dark, neon-accented mobile app shell recreating the concept image: splash, dashboard, live map, report wizard, AI alerts, and role tools. Built as a front-end experience with realistic sample data (no accounts or real database yet).

## Look and feel

- Deep obsidian background, neon cyan and electric blue accents, alert red for danger states.
- Glassy cards with soft glow borders, rounded corners, subtle gradients.
- Phone-style shell: simulated status bar at top, fixed bottom bar with Home, Map, Alerts (with red count badge), Profile.
- Unicorn shield emblem generated as artwork and used for branding and the app icon.

## Screens

1. **Welcome / Splash** (`/`)
   - Full-bleed city-at-dusk hero, unicorn shield, "Join the global fight against crime", Get Started + Sign In.
   - Get Started opens a role picker: Citizen, Patroller, Police, Security Company. Choice is remembered on the device and drives which tools appear.

2. **Home Dashboard** (`/home`)
   - Greeting, location header "Johannesburg, South Africa" with a switcher sheet of cities.
   - Large glowing red circular REPORT CRIME button with a pulsing halo, tap goes to the report wizard.
   - Quick action grid: Live Map, AI Alerts, Patrol Tools, Community, Safe Zones, SOS, Evidence Vault, Crime Stats. Role-specific tiles are highlighted; others stay visible.

3. **Live Map** (`/map`)
   - Stylised dark map canvas with filter chips: Crime Hotspots, Patrols, Safe Zones.
   - Coloured pins placed on the canvas; tapping one opens the bottom drawer showing the incident, distance ("2.4 km"), time and a View Details action.
   - "High Alert Area" drawer shown by default, dismissible.

4. **Report Crime** (`/report`)
   - Step 1: category grid (Theft, Assault, Robbery, Kidnapping, Fraud, Vandalism, Suspicious Activity, Other).
   - Step 2: description plus simulated photo / video / voice attachments (chips that show as added, no real upload).
   - Step 3: location tag using the device location when allowed, otherwise the selected city; confirm and submit.
   - Confirmation screen with a reference number; the report appears in the alerts feed and on the map for the session.

5. **AI Alerts** (`/alerts`)
   - Feed cards: Potential Threat Detected (red), Suspicious Vehicle with plate details (blue), Wanted Person (purple), each with timestamp and View on Map / View Details.
   - Detail sheet per alert.

6. **Profile & Role Tools** (`/profile`)
   - Role switcher between the four modes, profile summary, settings toggles.
   - Tools reachable from here and the dashboard: Patrol check-in log, Evidence Vault gallery, Crime Stats charts, Emergency SOS with hold-to-trigger and countdown.

## Technical notes

- TanStack Router file routes; each screen its own route with its own page title and description.
- Shared `AppShell` component for status bar, content area and bottom nav; splash renders outside the shell.
- Sample incidents, alerts, patrols and safe zones live in a typed data module; report submissions and role choice held in a small client store persisted to local storage.
- Design tokens (neon palette, glow shadows, pulse keyframes) added to `src/styles.css`; no hardcoded colours in components.
- Charts via Recharts for Crime Stats.
- Map is a custom stylised canvas, not a third-party map provider, so no keys are needed. Real map tiles can be added later.

## Not in this pass

Real accounts, saved data across devices, live police integration, actual media uploads. Those need a backend and can follow once the experience is approved.
