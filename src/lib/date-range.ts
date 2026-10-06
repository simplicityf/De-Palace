const BUSINESS_TZ = "Africa/Lagos";

/** Calendar date (YYYY-MM-DD) for a given instant, as seen in the business timezone. */
export function businessDateKey(date: Date = new Date()): string {
  return date.toLocaleDateString("en-CA", { timeZone: BUSINESS_TZ });
}

/** Start/end instants of a business-timezone calendar day (Africa/Lagos is UTC+1, no DST). */
export function businessDayBounds(date: Date = new Date()) {
  const key = businessDateKey(date);
  return {
    start: new Date(`${key}T00:00:00+01:00`),
    end: new Date(`${key}T23:59:59.999+01:00`),
  };
}

/** The last N business-timezone calendar dates (YYYY-MM-DD), oldest first, including today. */
export function lastNBusinessDateKeys(n: number): string[] {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const keys: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    keys.push(businessDateKey(new Date(now - i * dayMs)));
  }
  return keys;
}

/** Instant at which a business-timezone calendar date (YYYY-MM-DD) begins. */
export function businessDateStart(key: string): Date {
  return new Date(`${key}T00:00:00+01:00`);
}

/**
 * First and last calendar dates (YYYY-MM-DD) of a business-timezone month.
 * offset 0 = this month, -1 = previous month.
 */
export function businessMonthRange(offset = 0): { from: string; to: string } {
  const [year, month] = businessDateKey().split("-").map(Number);
  const first = new Date(Date.UTC(year, month - 1 + offset, 1));
  const last = new Date(Date.UTC(year, month + offset, 0));
  return {
    from: first.toISOString().slice(0, 10),
    to: last.toISOString().slice(0, 10),
  };
}
