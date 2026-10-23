<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep mine-safety provider actions as explicit client-side simulations until real control-room integrations are supplied, so demos never imply an external alert was delivered.
- Clock-in liveness is computed in-app from face-api landmarks (blink via eye aspect ratio, nod via nose movement); rules live in src/lib/clockin/events.ts with tests, so thresholds stay in one tested place.
- Location lookups by email or phone go through the public.dispatch_locate database function, which enforces the caller's role and viewer consent; never resolve another person's position from client code.
- Keep home-screen installation manifest-only and Pushpad messaging separate from app-shell caching; request push subscriptions only from an explicit user action.
- Both reporting screens use the authenticated sealReport server function to persist caller-owned evidence before requesting a Pushpad broadcast; never expose an arbitrary or repeat-send endpoint, and distinguish provider acceptance from device receipt.
