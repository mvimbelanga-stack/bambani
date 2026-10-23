# Pushpad setup

Home-screen installation uses `public/manifest.webmanifest`, linked in the root head, with 192px and 512px app icons and an Apple touch icon. No offline caching is enabled.

## Messaging worker

`public/service-worker.js` imports Pushpad's hosted messaging worker. The Pushpad SDK registers it when the user enables notifications. It does not cache the app shell.

## Provider configuration

1. Create a Pushpad project for `https://bambana.lovable.app`. Provider fees/limits follow your Pushpad plan.
2. Connect the Pushpad account using the secure connection card. Create an access token in Pushpad account settings; never paste it into source or chat.
3. Website project 9245 is configured for `https://bambana.lovable.app`; its public ID is in `src/lib/pushpad-config.ts`. The connected account credentials remain server-only.
4. Enable notifications from Profile → App & notifications on the published site. iPhone users need to add the app to their Home Screen before subscribing.

## Current verification boundary

Installation assets, SDK loader, messaging worker and opt-in/out controls are present. Subscription controls operate only on the configured published origin. Both report screens call authenticated `sealReport`, which saves caller-owned evidence before requesting an all-subscriber push through the connected account. Alerts contain actual coordinates and a Google Maps destination; no account identity is added. A failed push never causes an already sealed report to be reported as unsaved. The response distinguishes queued-device count from actual receipt. Existing open-app realtime alerts are unchanged.

Website-project creation and the app credential path were verified on 23 October 2026. The project initially had zero subscriptions. Closed-app receipt is not verified until an updated published app has a real subscription and a test alert is observed on that device with all app tabs closed. Provider acceptance and even provider successful-send counts alone do not establish that a user saw the alert.

## Real-device verification

1. Publish the updated app, then open Profile → App & notifications on `https://bambana.lovable.app` and enable notifications explicitly (iPhone: install first, then open from the Home Screen).
2. Confirm Pushpad lists the subscription; close every app tab on the receiving device while leaving its browser/OS notification service enabled.
3. On a second device, sign in and send a clearly labelled test report using actual GPS. The report is permanently sealed, so do not impersonate an emergency.
4. Check the notification's provider stats with `GET /notifications/{id}` and confirm receipt on the closed-app device. Tap the alert and confirm Google Maps opens the exact report coordinates. Record provider acceptance separately from device receipt.

Reference: https://pushpad.xyz/docs/javascript_sdk_reference and https://pushpad.xyz/docs/rest_api