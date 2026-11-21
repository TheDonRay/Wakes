import { describe, expect, it } from "vitest";
import {
  addDays,
  dayKey,
  formatClock,
  formatDuration,
  isSameDay,
  splitAtMidnight,
  startOfDay,
} from "./time";

// vite.config.ts pins TZ to America/New_York.
const ny = (y: number, mo: number, d: number, h = 0, mi = 0, s = 0) => new Date(y, mo - 1, d, h, mi, s);

describe("timezone", () => {
  it("runs in New York", () => {
    expect(Intl.DateTimeFormat().resolvedOptions().timeZone).toBe("America/New_York");
  });
});

describe("splitAtMidnight", () => {
  it("returns one piece within a day", () => {
    const parts = splitAtMidnight(ny(2026, 11, 21, 9), ny(2026, 11, 21, 10, 30));
    expect(parts).toHaveLength(1);
    expect(parts[0].end.getTime() - parts[0].start.getTime()).toBe(90 * 60 * 1000);
  });

  it("splits a session that crosses midnight", () => {
    const parts = splitAtMidnight(ny(2026, 11, 20, 23, 30), ny(2026, 11, 21, 0, 45));
    expect(parts).toHaveLength(2);
    expect(parts[0].end).toEqual(ny(2026, 11, 21));
    expect(parts[1].start).toEqual(ny(2026, 11, 21));
    expect(dayKey(parts[0].start)).toBe("2026-11-20");
    expect(dayKey(parts[1].start)).toBe("2026-11-21");
  });

  it("splits across several days", () => {
    const parts = splitAtMidnight(ny(2026, 11, 19, 22), ny(2026, 11, 22, 1));
    expect(parts.map((p) => dayKey(p.start))).toEqual(["2026-11-19", "2026-11-20", "2026-11-21", "2026-11-22"]);
  });

  it("ending exactly at midnight stays one piece", () => {
    const parts = splitAtMidnight(ny(2026, 11, 20, 23), ny(2026, 11, 21));
    expect(parts).toHaveLength(1);
  });

  it("returns nothing for empty or inverted ranges", () => {
    expect(splitAtMidnight(ny(2026, 11, 21, 9), ny(2026, 11, 21, 9))).toEqual([]);
    expect(splitAtMidnight(ny(2026, 11, 21, 10), ny(2026, 11, 21, 9))).toEqual([]);
  });

  it("handles the DST fall-back day (25 hours) in New York", () => {
    // 2026-11-01: clocks go 2:00 -> 1:00.
    const parts = splitAtMidnight(ny(2026, 10, 31, 23), ny(2026, 11, 2, 1));
    expect(parts.map((p) => dayKey(p.start))).toEqual(["2026-10-31", "2026-11-01", "2026-11-02"]);
    const hours = (p: { start: Date; end: Date }) => (p.end.getTime() - p.start.getTime()) / 3_600_000;
    expect(hours(parts[1])).toBe(25);
  });

  it("handles the DST spring-forward day (23 hours)", () => {
    // 2026-03-08: clocks go 2:00 -> 3:00.
    const parts = splitAtMidnight(ny(2026, 3, 7, 23), ny(2026, 3, 9, 1));
    expect((parts[1].end.getTime() - parts[1].start.getTime()) / 3_600_000).toBe(23);
  });
});

describe("day helpers", () => {
  it("addDays lands on local midnight across DST", () => {
    const d = addDays(ny(2026, 10, 31), 1);
    expect(d.getHours()).toBe(0);
    expect(dayKey(d)).toBe("2026-11-01");
    expect(dayKey(addDays(ny(2026, 11, 1), 1))).toBe("2026-11-02");
  });

  it("startOfDay and isSameDay use local time", () => {
    expect(startOfDay(ny(2026, 11, 21, 23, 59))).toEqual(ny(2026, 11, 21));
    // 03:30 UTC on Nov 22 is still Nov 21 in New York.
    expect(isSameDay(new Date("2026-11-22T03:30:00Z"), ny(2026, 11, 21, 12))).toBe(true);
  });
});

describe("formatting", () => {
  it("formatClock", () => {
    expect(formatClock(0)).toBe("00:00:00");
    expect(formatClock(3725)).toBe("01:02:05");
    expect(formatClock(-5)).toBe("00:00:00");
  });

  it("formatDuration", () => {
    expect(formatDuration(0)).toBe("0m");
    expect(formatDuration(30)).toBe("<1m");
    expect(formatDuration(14 * 60)).toBe("14m");
    expect(formatDuration(2 * 3600 + 14 * 60 + 59)).toBe("2h 14m");
    expect(formatDuration(3600)).toBe("1h");
  });
});
