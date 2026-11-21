# Focus Dashboard
 
A frontend-only productivity dashboard. Add tasks, run a timer on each one, and see your daily focus time, completed tasks, and a history of past days. The visual style is strictly black and white.
 
---
 
## 1. Goals
 
**Product goals**
- Add, edit, and delete tasks quickly (keyboard-friendly).
- Start, pause, and stop a timer on any task. Only one timer runs at a time.
- See today's stats at a glance: focus time, tasks completed, completion rate.
- Review past days and weeks in a simple chart.
- Minimal black-and-white aesthetic: black, white, and grays only.
---
 
## 2. Scope
 
### In scope
- Task list: title, optional estimate, status (todo / in progress / done).
- Per-task timer: start, pause, resume, stop. Each run is saved as a session.
- Dashboard cards: focus time today, tasks done today, completion rate.
- Daily focus bar chart for the last 7 days.
- Persistence in `localStorage`, wrapped in a small service module.
- Responsive layout (mobile and desktop).
### Out of scope
- Backend, REST API, database, and Postman collections
- Auth and multi-user accounts
- Calendar integrations
- AI features (calling an LLM from the browser would expose the API key, so these are excluded)
### Stretch (still frontend only)
- Pomodoro preset (25/5) with a browser notification.
- Keyboard shortcuts for start/stop and add task.
- Export today's log as a `.json` or `.csv` download.
- Rule-based "next task" suggestion (for example, the shortest unfinished estimate), with no API calls.
---
 
## 3. Tech Stack
 
| Layer | Choice | Why |
|---|---|---|
| Build tool | Vite | Fast dev server, minimal config |
| UI | React 18+ with TypeScript | Type safety catches bugs early |
| Styling | Plain CSS with variables | Easy to lock the palette to black and white |
| Charts | Recharts | Simple bar charts, easy to style in grayscale |
| State | React state + custom hooks; Zustand optional | Keep it simple first |
| Persistence | `localStorage` behind a `storage.ts` module | Keeps components unaware of where data lives |
| Testing | Vitest + React Testing Library | Fast, integrates with Vite |
 
---
 
## 4. Design: Black and White
 
**Palette (CSS variables)**
 
```css
:root {
  --bg: #0a0a0a;
  --surface: #141414;
  --surface-2: #1c1c1c;
  --border: #2a2a2a;
  --text: #f5f5f5;
  --text-muted: #8a8a8a;
  --accent: #ffffff;      /* primary actions, active timer */
  --invert-bg: #ffffff;   /* buttons on hover */
  --invert-text: #000000;
}
```
 
**Visual rules**
- No color. Hierarchy comes from weight, size, spacing, and borders.
- Thin 1px borders instead of heavy shadows.
- Active timer shows as a solid white pill with a blinking dot.
- Completed tasks get a strikethrough and muted text.
- Monospace font for timers (for example, JetBrains Mono or `ui-monospace`).
- Sans-serif for everything else (Inter or system UI).
- Light mode optional later: flip the variables.
**Layout (desktop)**
 
```
+------------------------------------------------------------+
|  FOCUS                                     Sat, Nov 21     |
+------------------------------------------------------------+
|  [ Focus 2h 14m ]   [ Done 5/8 ]   [ Rate 62% ]            |
+-----------------------------+------------------------------+
|  Tasks                      |  Last 7 days                 |
|  [+ add task]               |  ▇   ▇▇  ▇▇▇ ▇  ▇▇▇▇ ▇▇      |
|  ○ Write docs      00:12:04 |                              |
|  ● Fix layout bug  00:45:10 |  Completed tasks             |
|  ✓ Standup notes            |  ...                         |
+-----------------------------+------------------------------+
```
 
---
 
## 5. Data Model
 
```ts
type Task = {
  id: string;            // uuid
  title: string;
  estimateMin?: number;  // optional planned minutes
  status: "todo" | "in_progress" | "done";
  createdAt: string;     // ISO
  completedAt?: string;  // ISO
};
 
type Session = {
  id: string;
  taskId: string;
  startedAt: string;     // ISO
  endedAt: string;       // ISO
  durationSec: number;
};
 
// Stored in localStorage under two keys: "fd.tasks" and "fd.sessions".
// Plus "fd.activeTimer" = { taskId, startedAt } while a timer is running.
 
// Derived, not stored:
// - focusSecondsToday = sum(session.durationSec where startedAt is today)
// - tasksCompletedToday = count(task.completedAt is today)
// - completionRate = done / total tasks created today
```
 
---
 
## 6. Core Behaviors
 
**Timer rules**
- Starting a timer on task B automatically pauses task A and saves its session.
- Timer state survives a page refresh. Store `fd.activeTimer` in `localStorage`, then recompute elapsed time on load.
- Stop saves a session. Pause saves a partial session.
- Use `Date.now()` differences, not `setInterval` counts, so timers stay accurate when the tab is in the background.
- A session that crosses midnight is split at midnight so each day's stats are correct.
**Task rules**
- Enter adds a task. Escape cancels an edit.
- Marking a task done stops its timer and sets `completedAt`.
- Deleting a task also deletes its sessions (confirm first).
**Stats rules**
- "Today" uses the local timezone (America/New_York for you).
- Stats recompute from sessions and tasks. Do not store totals separately, which avoids drift.
---
 
## 7. Project Structure
 
```
focus-dashboard/
├── index.html
├── vite.config.ts
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── styles/
│   │   └── globals.css           # black/white variables
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── StatCard.tsx
│   │   ├── TaskList.tsx
│   │   ├── TaskItem.tsx
│   │   ├── TaskForm.tsx
│   │   ├── TimerDisplay.tsx
│   │   └── WeeklyChart.tsx
│   ├── hooks/
│   │   ├── useTasks.ts
│   │   ├── useTimer.ts
│   │   └── useStats.ts
│   ├── services/
│   │   └── storage.ts            # all localStorage reads/writes
│   ├── lib/
│   │   ├── time.ts               # formatting, date helpers, midnight split
│   │   └── stats.ts              # pure functions: focus time, rates
│   └── types.ts
└── src/**/*.test.ts(x)           # Vitest tests next to the code
```
 
Keep `lib/stats.ts` and `lib/time.ts` pure (no React, no storage). They are the easiest code to test and the most likely to have bugs.
 
---
 
## 8. Build Plan
 
**Milestone 1: Skeleton (about 1 evening)**
- `npm create vite@latest focus-dashboard -- --template react-ts`
- Add the CSS variables and a blank layout with three placeholder cards.
**Milestone 2: Tasks (about 1 evening)**
- Add, complete, edit, and delete tasks. Persist via `storage.ts`.
**Milestone 3: Timer (1 to 2 evenings)**
- `useTimer` hook with start, pause, and stop.
- Persist the active timer across refreshes.
- Write sessions on stop, splitting at midnight.
 
**Milestone 4: Stats and chart (1 evening)**
- Today's focus time, tasks done, completion rate.
- 7-day Recharts bar chart in grayscale.
**Milestone 5: Tests (1 evening)**
- Vitest tests for `stats.ts` and `time.ts`, including the midnight-split and paused-timer cases.
- One component test for the add-task and complete flow.
**Milestone 6: Polish (1 evening)**
- Keyboard shortcuts, empty states, responsive layout, and a production build with `npm run build`.
**Stretch**
- Pomodoro preset, export to JSON/CSV, or the rule-based next-task suggestion.
---
 
## 9. Testing
 
- **Unit (Vitest):** `lib/stats.ts` and `lib/time.ts`. Example cases: sessions that cross midnight, paused timers, zero-task days, DST changes in New York.
- **Component (React Testing Library):** task add/complete flow, timer button states.
- **Manual:** refresh during a running timer and confirm elapsed time is still correct.
---
 
## 10. Definition of Done
 
- [ ] Create, complete, edit, and delete a task
- [ ] Start and stop a timer; a session is saved
- [ ] Only one timer runs at a time; switching tasks pauses the previous one
- [ ] Timer survives a page refresh
- [ ] Sessions that cross midnight are split correctly
- [ ] Today's focus time, tasks done, and completion rate are correct
- [ ] 7-day chart renders with no color, only black, white, and grays
- [ ] Works at 375px width and at desktop width
- [ ] Unit tests for `lib/stats.ts` and `lib/time.ts` pass
- [ ] `npm run build` succeeds and the app deploys as a static site
---
 
## 11. Open Questions
 
- Should a task be allowed to have several timers over several days? (Recommended: yes, sessions handle it.)
- Do you want the Pomodoro preset in the first release or as a stretch goal? (Recommended: stretch.)
- Where will you host it? (Recommended: Cloudflare Pages or Netlify. Both deploy a Vite build with no backend.)
---
 
## 12. Next Step
 
```bash
npm create vite@latest focus-dashboard -- --template react-ts
cd focus-dashboard
npm install recharts
npm run dev
```
 
Then add `globals.css` and the component tree from section 7, and start on `useTimer`.
 