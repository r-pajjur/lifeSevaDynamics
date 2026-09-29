# Rasa Lila

A static site holding small seva apps for the community, deployed together on
Vercel.

| Path | App | Built with |
| --- | --- | --- |
| `/` | Landing page | one hand-written HTML file |
| `/jeopardy/` | Committee Jeopardy board | one hand-written HTML file |
| `/habits-to-heroes/` | Habits to Heroes Jeopardy | one hand-written HTML file |
| `/room-booking/` | Retreat registration | static HTML + ES modules |
| `/seekingculture/` | Seeking Culture class activities (gunas, The Yatra) | static HTML + JS, Firebase |
| `/wayfinder/` | Indoor wayfinding, photo by photo | Angular 19 + TypeScript, PWA |

Dhara lives in its own repo (`jyoti`) because it has an API, a cron job and
push notifications; the landing page links out to it.

Every app under `site/` uses relative paths, so `vercel.json` sets
`trailingSlash: true` — without it `/room-booking` would load its assets
from `/` instead of `/room-booking/`.

## Layout

```
site/              what gets served as-is (no build step)
  index.html         landing page
  jeopardy/          Committee Jeopardy
  habits-to-heroes/  Habits to Heroes Jeopardy
  room-booking/      retreat registration (moved from roomBookingLG)
  seekingculture/    class activities (moved from seekingculture)
wayfinder/         Angular app (see wayfinder/README.md)
scripts/build.mjs  copies site/ and the Angular build into dist/
dist/            build output — git-ignored, this is what Vercel serves
```

## Running it locally

```bash
npm install          # also installs the Angular app's dependencies
npm start            # ng serve on http://localhost:4200 (wayfinder only)
```

For the whole site, including the landing page and Jeopardy:

```bash
npm run build
npx serve dist       # or: cd dist && python3 -m http.server 8777
```

The Jeopardy board is plain HTML — open `site/jeopardy/index.html` in a browser
and it works, no server needed.

## Deploying

`vercel.json` already tells Vercel what to do: `npm run build`, serve `dist`.
Pushing to `main` is enough. If the Vercel project was set up earlier with
"Framework Preset: Other" and empty build settings, `vercel.json` overrides
them — nothing to change in the dashboard.

Node 20.19+ (or 22.12+) is needed to run the Angular CLI. This machine is on
20.17, which is why the app is pinned to Angular 19 rather than 20.
