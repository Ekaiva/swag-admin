# Push Notification Admin

A minimal single-page admin tool to send Expo push notifications to the companion
React Native app and deep-link the recipient to a chosen screen.

- **Frontend:** React + Vite + TypeScript (strict)
- **Backend:** Vercel Serverless Functions in `/api` (plain Node handlers, framework-agnostic)
- **Live URL:** _<add after deploying — see "Deploy" below>_

## Project layout

```
admin/
  api/
    send-notification.ts   POST handler -> calls Expo Push API (Vercel function)
  src/
    App.tsx                the single admin page
    components/
      NotificationForm.tsx form UI + client-side validation
      StatusBanner.tsx     success/failure response display
    lib/
      api.ts               fetch wrapper for /api/send-notification
      types.ts             shared client types
    hooks/
      useSendNotification.ts  submit lifecycle state
  shared/
    expo-push.ts           server-side Expo API client (imported by the function)
  vite.config.ts
  vercel.json
  .env.example
```

## Local development

```bash
cd admin
npm install
# Run the frontend + serverless functions together (recommended):
npx vercel dev
# ...or just the static frontend (the /api route won't run):
npm run dev
```

> The `/api/send-notification` function only runs under `vercel dev` or on a Vercel
> deployment. Plain `npm run dev` serves the UI only.

Quality gates:

```bash
npm run typecheck   # tsc --noEmit, strict, no `any`
npm run lint        # eslint
npm run format      # prettier --write
```

## How to test sending a notification

1. Run the Expo app (`../app`) on a **physical device** (push tokens are not issued on
   simulators) and grant notification permission.
2. Copy the device's Expo push token. It looks like `ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]`.
   The app logs / exposes this token on launch; paste it into the admin form.
3. In the admin UI: paste the token, enter a **Title** and **Body**, pick a **Target screen**
   (Screen 1 = Home, Screen 2 = Discover, Screen 3 = Profile).
4. Click **Send notification**. The status banner shows Expo's raw response — a success
   ticket (`{ "data": { "status": "ok", "id": "..." } }`) or an error such as
   `DeviceNotRegistered`.
5. Tapping the delivered notification deep-navigates the app using the `data.screen` field.

## API route shape

`POST /api/send-notification`

Request body:

```json
{
  "token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
  "title": "Hello",
  "body": "Open Discover",
  "screen": "2"
}
```

Success response (Expo's body, forwarded verbatim):

```json
{ "data": { "status": "ok", "id": "0d6a3...e1" } }
```

Error responses:

- `405 { "error": "Method Not Allowed" }` — non-POST request.
- `400 { "error": "Missing required fields: token, title, body, screen" }` — bad input.
- `502 { "error": "Expo push request failed: ..." }` — Expo unreachable / non-2xx.
- A `200` with `{ "data": { "status": "error", "message": "DeviceNotRegistered", ... } }`
  is still returned for per-device problems (the request itself succeeded).

## Environment variables

The core tool needs **none** — Expo's push endpoint is public and key-less. The user-typed
token/title/body are inputs, not secrets, and no DB key ships in the client bundle.

The optional KV-backed token-list bonus (not implemented here) would use
`KV_REST_API_URL` and `KV_REST_API_TOKEN`; see `.env.example`.

## Deploy (Vercel)

```bash
cd admin
npx vercel        # first deploy, links/creates the project
npx vercel --prod # production deploy
```

`vercel.json` tells Vercel to build with `vite build`, serve `dist/`, and SPA-rewrite all
non-API routes to `index.html`. Functions in `/api` are auto-detected. After deploying,
paste the URL into the **Live URL** field above.

## Why plain React + Vercel serverless (not Next.js)

This is a one-page internal utility with a single backend endpoint. Next.js would add a
router, framework conventions, and build complexity that buy nothing here. Vite gives a
faster, leaner dev/build loop, and Vercel runs plain Node handlers from a top-level `/api`
folder regardless of the frontend framework. So the chosen stack delivers the exact same
"static UI + one serverless function" capability with far less surface area — which matches
the assignment's goal of a small, cleanly-structured tool.
