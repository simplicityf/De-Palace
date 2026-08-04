import Link from "next/link";
import { and, eq, gte, lte, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { items, sales, shifts, users } from "@/lib/db/schema";
import { formatNaira } from "@/lib/currency";
import { businessDayBounds, lastNBusinessDateKeys } from "@/lib/date-range";
import { SalesTrendChart } from "@/components/sales/sales-trend-chart";

const LOW_STOCK_THRESHOLD = 5;

export default async function AdminDashboardPage() {
  const session = await auth();

  const { start: startOfDay, end: endOfDay } = businessDayBounds();
  const last7Days = lastNBusinessDateKeys(7);
  const sevenDaysAgo = new Date(`${last7Days[0]}T00:00:00+01:00`);

  const [todaySalesRow] = await db
    .select({ total: sql<number>`coalesce(sum(${sales.totalAmount}), 0)`.mapWith(Number) })
    .from(sales)
    .where(and(gte(sales.soldAt, startOfDay), lte(sales.soldAt, endOfDay)));

  const activeShifts = await db
    .select({
      id: shifts.id,
      assistantName: users.name,
      startedAt: shifts.startedAt,
    })
    .from(shifts)
    .innerJoin(users, eq(shifts.salesAssistantId, users.id))
    .where(eq(shifts.status, "active"));

  const lowStock = await db
    .select({ id: items.id, name: items.name, quantity: items.quantity })
    .from(items)
    .where(and(eq(items.isArchived, false), lte(items.quantity, LOW_STOCK_THRESHOLD)))
    .orderBy(items.quantity);

  const trendRows = await db
    .select({
      day: sql<string>`to_char(${sales.soldAt} AT TIME ZONE 'Africa/Lagos', 'YYYY-MM-DD')`.as(
        "day",
      ),
      total: sql<number>`sum(${sales.totalAmount})`.mapWith(Number),
    })
    .from(sales)
    .where(gte(sales.soldAt, sevenDaysAgo))
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
    <div className="space-y-8">
      <h1 className="font-serif text-2xl text-brand-green">
        Welcome, {session?.user?.name}
      </h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-brand-green/10 bg-white/90 p-6 shadow-sm backdrop-blur">
          <p className="text-sm text-muted-foreground">Today&apos;s sales</p>
          <p className="font-serif text-2xl text-brand-green">
            {formatNaira(todaySalesRow?.total ?? 0)}
          </p>
        </div>
        <div className="rounded-xl border border-brand-green/10 bg-white/90 p-6 shadow-sm backdrop-blur">
          <p className="text-sm text-muted-foreground">Active shifts</p>
          <p className="font-serif text-2xl text-brand-green">{activeShifts.length}</p>
        </div>
        <div className="rounded-xl border border-brand-green/10 bg-white/90 p-6 shadow-sm backdrop-blur">
          <p className="text-sm text-muted-foreground">Low stock items</p>
          <p className="font-serif text-2xl text-brand-green">{lowStock.length}</p>
        </div>
      </div>

      <div className="rounded-xl border border-brand-green/10 bg-white/90 p-6 shadow-sm backdrop-blur">
        <h2 className="mb-4 font-serif text-lg text-brand-green">Last 7 days</h2>
        <SalesTrendChart data={trendData} />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="mb-2 font-serif text-lg text-brand-green">Active shifts</h2>
          <div className="divide-y rounded-xl border border-brand-green/10 bg-white/90 shadow-sm backdrop-blur">
            {activeShifts.map((shift) => (
              <Link
                key={shift.id}
                href={`/admin/sales/${shift.id}`}
                className="flex items-center justify-between px-4 py-3 text-sm hover:bg-brand-green/5"
              >
                <span>{shift.assistantName}</span>
                <span className="text-muted-foreground">
                  Since {shift.startedAt.toLocaleTimeString()}
                </span>
              </Link>
            ))}
            {activeShifts.length === 0 && (
              <p className="px-4 py-6 text-center text-muted-foreground">
                No one is currently clocked in.
              </p>
            )}
          </div>
        </div>

        <div>
          <h2 className="mb-2 font-serif text-lg text-brand-green">Low stock</h2>
          <div className="divide-y rounded-xl border border-brand-green/10 bg-white/90 shadow-sm backdrop-blur">
            {lowStock.map((item) => (
              <div key={item.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <span>{item.name}</span>
                <span className="font-medium text-destructive">
                  {item.quantity} left
                </span>
              </div>
            ))}
            {lowStock.length === 0 && (
              <p className="px-4 py-6 text-center text-muted-foreground">
                Everything is well stocked.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
