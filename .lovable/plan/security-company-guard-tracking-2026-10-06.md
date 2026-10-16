# Security Company Guard Tracking

## Goal
Add the uploaded five-part guard tracking experience only to **Security Company** mode. Other roles and pages remain unchanged.

## Build
- Add a **Guard Tracking** button to the Security Company tools on Home and Profile only.
- Create a dedicated mobile-first Security Company page with two views:
  - **Guard Device:** On Duty / Log Off controls, high-accuracy GPS, speed, timestamp, signal and battery status. While on duty, send an update every 5–10 seconds; logging off immediately stops tracking and clears the active marker.
  - **Control Room:** live map, active guard markers, movement direction, Moving / Stationary / Offline status, assigned patrol zone, shift controls and alert feed.
- Add a built-in test mode that runs a mock route, demonstrates animated updates, geofence exit, no-movement warning, and verifies marker removal after log-off.
- Use Lovable Cloud Realtime for live sessions and telemetry. Protect all guard data with signed-in access rules; guards can manage only their own stream, while approved Security Company operators can view and control active company sessions.
- Keep visible provider/escalation actions clearly labelled as tests until a real control-room integration is supplied.

## Security and privacy
- Add a restricted `security_company` role requiring admin approval; never trust the client-side role switcher as authorization.
- Store roles separately from profiles and enforce access in database policies.
- Reuse the existing Company tracking consent and session retention rules before live tracking begins.
- Stop browser tracking on log-off, duty end, unmount, or session termination.

## Validation
- Add focused tests for duty-state update timing, movement status, geofence detection, no-movement timing, and immediate marker removal.
- Test Security Company visibility, guard/control-room interactions, simulated route alerts, mobile layout, and preview errors.
