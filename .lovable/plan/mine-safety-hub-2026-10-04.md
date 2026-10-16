# Mine safety hub

## What will be built
- Add a prominent **MINE** button to the home dashboard.
- Create a mobile-first mine safety screen matching the existing dark neon app style.
- Include eight interactive solutions based on the supplied reference:
  1. Fence & cable theft protection
  2. Ventilation fan security
  3. Tailings dam early warning
  4. Illegal mining alert
  5. Women mine-worker panic support
  6. Emergency evacuation mass alert
  7. Contractor truck anti-hijack
  8. SLP proof with GPS reports
- Give each solution a clear status, useful test action, confirmation notification, and focused detail view.
- Keep external dispatch, sensors, and mine control-room integrations explicitly simulated so testing never shows broken service errors.

## Verification
- Confirm the MINE button opens the new screen.
- Exercise all eight actions at a phone-sized viewport.
- Check navigation, notifications, layout, console output, and the latest preview build status.

## Technical details
- Add a dedicated TanStack route and route metadata.
- Reuse the existing app shell, semantic design tokens, Sonner notifications, and shared button/dialog components.
- Keep demo state in the browser only; no new database or third-party integration is needed for this test version.
