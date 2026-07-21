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
   Enter just a `DURATION` with no text (e.g. `1`) to skip that stretch of
   time instead of creating a task. Click away to pause it; a "Continue adding
   tasks" button brings it back.
3. The calendar shows the previous day on the left (read history) and the focused day on the
   right — today by default, paged with `←`/`→` or `a`/`d` — hour rows from 00:00–24:00. Beyond
   yesterday/today/tomorrow, the column headers just show the date. Click a task to edit its title/description
   in the right-hand sidebar. Drag the bottom edge of a task to resize it.
   Click and drag on empty calendar space to create a new task in that slot.
4. **Double right-click** a task to delete it instantly.
5. Toggle **Week** view (Monday-start, with prev/next arrows) from the header,
   or **Day** to return. Click any date's header in Week view to plan it the
   same way as today — it prompts for that day's active hours if it doesn't
   have any yet, then drops you into the same sequential quick-add flow.
6. Press `j` to jump the day view straight to any date: type it as `MM/DD`
   (the year rolls over automatically — entering an already-passed date jumps
   to next year's occurrence instead of the past) and it shows `Today | that
   date`, prompting for its active hours and dropping into quick-add just like
   any other day.
7. **Export** in the header downloads all ranges/tasks as a JSON file.

## Keyboard shortcuts

| Key | Action |
| --- | --- |
| `↑` / `↓` | Loop through the day's tasks (wraps at either end). Works even while typing in the quick-add bar — if you've typed something unsaved, you'll be asked before it's discarded. |
| `w` / `s` | Same as `↑` / `↓` (only outside text fields). |
| `←` / `→` or `a` / `d` | Page one day back/forward in Day view, or one week back/forward in Week view. |
| `.` | Jump back to today (Day view) or the current week (Week view). |
| `j` | Prompt for a `MM/DD` date and jump the day view straight to it, paired with today. |
| `q` | Switch to Week view (resets quick-add planning back to today). |
| `e` | Switch to Day view (resets quick-add planning back to today). |
| `i` | Activate the quick-add bar for whichever date is currently being planned (same as "+Continue"). |
| `x` | Delete the selected task (asks for confirmation). |
| Double-right-click a task | Delete it instantly, no confirmation. |
| `t` | Toggle light/dark theme. |
| `Escape` | Close the sidebar / cancel a dialog. |

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
