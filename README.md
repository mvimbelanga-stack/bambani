# Welcome to your Lovable project

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Open your project in the [Lovable editor](https://lovable.dev) and keep building.

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: connect the project to GitHub and every change made in Lovable is committed straight to your repository.
- **Full ownership**: this code is yours. Push to your repository and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Built with

- TanStack Start
- TypeScript
- React
- Tailwind CSS

## Biometric Clock-In (patrollers & security)

- `/clock-in`: live camera, face box (face-api, `@vladmandic/face-api` fork), blink + nod liveness (score must reach 0.85), high-accuracy GPS (rejected above 50 m), HTTPS required.
- `/clock-history`: saved events (stored in `localStorage` key `wcu-clockins-v1`).
- Installable on Android/iOS through `public/manifest.webmanifest` ("Add to Home Screen" / "Install app").

## Deployment

Lovable: click **Publish** (recommended; HTTPS included).

Netlify / Vercel: this is a TanStack Start (SSR) app built with Vite + Nitro.
1. Set the Nitro preset: `NITRO_PRESET=netlify` or `NITRO_PRESET=vercel` as a build env var.
2. Build command `bun run build`; add the `VITE_SUPABASE_*` env vars from `.env`.
3. Both hosts serve HTTPS by default, which the camera and GPS need.
