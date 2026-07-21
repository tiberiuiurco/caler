# Caler

A fast, minimal daily planner built around the time-blocking philosophy.
Single-user, no login, no backend — every plan lives in your browser's
`localStorage` and can be exported to JSON at any time.

## Stack

- [Vite](https://vite.dev) + React 19 + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com) for styling (light/dark mode via a `dark` class)
- [Zustand](https://github.com/pmndrs/zustand) with the `persist` middleware for local, durable state
- [date-fns](https://date-fns.org) for date math

## How it works

1. On open, if today has no active hour range yet, a centered modal asks for
   one (e.g. `5-21`), auto-focused so you can just start typing.
2. Once set, a quick-add bar appears at the top, auto-focused. Type entries as
   `DURATION TEXT` (e.g. `1.5 Write report`) and press Enter — it keeps
   re-focusing itself so you can plan the whole day without touching the mouse.
   Click away to pause it; a "Continue adding tasks" button brings it back.
3. The calendar shows yesterday on the left (read history) and today on the
   right, hour rows from 00:00–24:00. Click a task to edit its title/description
   in the right-hand sidebar. Drag the bottom edge of a task to resize it.
   Click and drag on empty calendar space to create a new task in that slot.
4. **Double right-click** a task to delete it instantly.
5. Toggle **Week** view (Monday-start, with prev/next arrows) from the header,
   or **Day** to return. `W` and `T` are keyboard shortcuts for view/theme
   toggling when focus isn't in a text field.
6. **Export** in the header downloads all ranges/tasks as a JSON file.

## Development

```sh
pnpm install
pnpm dev       # local dev server
pnpm build     # production build -> dist/
pnpm lint      # oxlint
```

## Deploying to GitHub Pages

`vite.config.ts` uses `base: './'`, so the build in `dist/` is fully relocatable —
push to GitHub Pages, any sub-path, or open `dist/index.html` directly. A ready-made
workflow at `.github/workflows/deploy.yml` builds and publishes `dist/` to GitHub
Pages on every push to `main` (enable Pages → "GitHub Actions" as the source once).
