# Wakes
productivity dashboard where you add tasks, run a timer on each one, and track your daily focus time and completed tasks over time

## Run it

```bash
cd frontend
npm install
npm run dev      # http://localhost:5173
npm test         # Vitest: lib/time, lib/stats, and App flows
npm run build    # static site in frontend/dist
```

Data lives in your browser's `localStorage` (`fd.tasks`, `fd.sessions`, `fd.activeTimer`). There is no backend.

Shortcuts: `N` new task · `Space` start/pause · `S` stop · `P` toggle Pomodoro (25/5).
