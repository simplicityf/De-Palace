import { and, eq, gte, lte, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sales, shifts } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import { EndShiftButton } from "@/components/sales/end-shift-button";
import { SalesTrendChart } from "@/components/sales/sales-trend-chart";
import { formatNaira } from "@/lib/currency";
import { startShift } from "@/lib/actions/shifts";
import { businessDayBounds, lastNBusinessDateKeys } from "@/lib/date-range";

export default async function SalesDashboardPage() {
  const session = await auth();
  const userId = session!.user.id;

  const { start: startOfDay, end: endOfDay } = businessDayBounds();
  const last7Days = lastNBusinessDateKeys(7);
  const sevenDaysAgo = new Date(`${last7Days[0]}T00:00:00+01:00`);

  const [activeShift] = await db
    .select({ id: shifts.id, startedAt: shifts.startedAt })
    .from(shifts)
    .where(and(eq(shifts.salesAssistantId, userId), eq(shifts.status, "active")))
    .limit(1);

  const [todayRow] = await db
    .select({
      total: sql<number>`coalesce(sum(${sales.totalAmount}), 0)`.mapWith(Number),
      items: sql<number>`coalesce(sum(${sales.quantitySold}), 0)`.mapWith(Number),
    })
    .from(sales)
    .innerJoin(shifts, eq(sales.shiftId, shifts.id))
    .where(
      and(
        eq(shifts.salesAssistantId, userId),
        gte(sales.soldAt, startOfDay),
        lte(sales.soldAt, endOfDay),
      ),
    );

  const trendRows = await db
    .select({
      day: sql<string>`to_char(${sales.soldAt} AT TIME ZONE 'Africa/Lagos', 'YYYY-MM-DD')`.as(
        "day",
      ),
      total: sql<number>`sum(${sales.totalAmount})`.mapWith(Number),
    })
    .from(sales)
    .innerJoin(shifts, eq(sales.shiftId, shifts.id))
    .where(and(eq(shifts.salesAssistantId, userId), gte(sales.soldAt, sevenDaysAgo)))
    .groupBy(sql`to_char(${sales.soldAt} AT TIME ZONE 'Africa/Lagos', 'YYYY-MM-DD')`);

  const trendByDay = new Map(trendRows.map((row) => [row.day, row.total]));
  const trendData = last7Days.map((key) => ({
    date: key,
    label: new Date(`${key}T12:00:00+01:00`).toLocaleDateString(undefined, {
      weekday: "short",
    }),
    total: trendByDay.get(key) ?? 0,
  }));

  return (
    <div className="space-y-6 sm:space-y-8 px-4 sm:px-0">
      {/* Shift Status Card */}
      <div className="rounded-xl border border-brand-green/10 bg-white/90 p-4 sm:p-6 shadow-sm backdrop-blur">
        {activeShift ? (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Shift in progress</p>
              <h1 className="font-serif text-xl sm:text-2xl text-brand-green">
                Since {activeShift.startedAt.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </h1>
            </div>
            <EndShiftButton shiftId={activeShift.id} />
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">No active shift</p>
              <h1 className="font-serif text-xl sm:text-2xl text-brand-green">
                Ready to start?
              </h1>
            </div>
            <form action={startShift}>
              <Button type="submit" size="lg" className="w-full sm:w-auto">
                Start shift
              </Button>
            </form>
          </div>
        )}
      </div>

      {/* Today's Stats Grid */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
        <div className="rounded-xl border border-brand-green/10 bg-white/90 p-4 sm:p-6 shadow-sm backdrop-blur">
          <p className="text-sm text-muted-foreground">Today&apos;s sales</p>
          <p className="font-serif text-xl sm:text-2xl text-brand-green">
            {formatNaira(todayRow?.total ?? 0)}
          </p>
        </div>
        <div className="rounded-xl border border-brand-green/10 bg-white/90 p-4 sm:p-6 shadow-sm backdrop-blur">
          <p className="text-sm text-muted-foreground">Items sold today</p>
          <p className="font-serif text-xl sm:text-2xl text-brand-green">
            {todayRow?.items ?? 0}
          </p>
        </div>
      </div>

      {/* Sales Trend Chart */}
      <div className="rounded-xl border border-brand-green/10 bg-white/90 p-4 sm:p-6 shadow-sm backdrop-blur overflow-x-auto">
        <h2 className="mb-4 font-serif text-lg sm:text-xl text-brand-green">
          Last 7 days
        </h2>
        <div className="min-w-[300px]">
          <SalesTrendChart data={trendData} />
        </div>
      </div>
    </div>
  );
}