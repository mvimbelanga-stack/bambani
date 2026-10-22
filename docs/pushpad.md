# Pushpad setup

Home-screen installation uses `public/manifest.webmanifest`, linked in the root head, with 192px and 512px app icons and an Apple touch icon. No offline caching is enabled.

## Messaging worker

`public/service-worker.js` imports Pushpad's hosted messaging worker. The Pushpad SDK registers it when the user enables notifications. It does not cache the app shell.

## Provider configuration

1. Create a Pushpad project for `https://bambana.lovable.app`. Provider fees/limits follow your Pushpad plan.
2. Connect the Pushpad account using the secure connection card. Create an access token in Pushpad account settings; never paste it into source or chat.
3. Supply the public Pushpad project ID. The browser reads `VITE_PUSHPAD_PROJECT_ID`; this is a public identifier, not the account token.
4. Enable notifications from Profile → App & notifications on the published site. iPhone users need to add the app to their Home Screen before subscribing.

## Current verification boundary

Installation assets, SDK loader, messaging worker and opt-in/out controls are present. Without a connected account and project ID, the notification button remains disabled. Server-side delivery from sealed reports must be connected and verified before claiming reports reach closed apps. Existing open-app realtime alerts are unchanged.

Reference: https://pushpad.xyz/docs/javascript_sdk_reference and https://pushpad.xyz/docs/rest_api