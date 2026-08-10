import Link from "next/link";
import { and, eq, gte, lte, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { items, sales, shifts, users } from "@/lib/db/schema";
import { formatNaira } from "@/lib/currency";
import { businessDayBounds, lastNBusinessDateKeys } from "@/lib/date-range";
import { SalesTrendChart } from "@/components/sales/sales-trend-chart";
import { 
  TrendingUp, 
  Users, 
  Package, 
  Clock, 
  AlertCircle,
  ChevronRight,
  BarChart3 
} from "lucide-react";

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

  const stats = [
    {
      label: "Today's sales",
      value: formatNaira(todaySalesRow?.total ?? 0),
      icon: TrendingUp,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      label: "Active shifts",
      value: activeShifts.length,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      label: "Low stock items",
      value: lowStock.length,
      icon: Package,
      color: lowStock.length > 0 ? "text-amber-600" : "text-green-600",
      bgColor: lowStock.length > 0 ? "bg-amber-50" : "bg-green-50",
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-xl sm:text-2xl md:text-3xl text-brand-green">
            Welcome back, {session?.user?.name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here&apos;s what&apos;s happening at DePalace today.
          </p>
        </div>
        <div className="text-sm text-muted-foreground bg-white/50 rounded-lg px-3 py-2 border border-brand-green/10">
          <Clock className="inline-block w-4 h-4 mr-1.5 text-brand-green" />
          {new Date().toLocaleDateString(undefined, { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="rounded-xl border border-brand-green/10 bg-white/90 p-4 sm:p-6 shadow-sm backdrop-blur hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1 sm:space-y-2">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {stat.label}
                  </p>
                  <p className="font-serif text-xl sm:text-2xl md:text-3xl text-brand-green">
                    {stat.value}
                  </p>
                </div>
                <div className={`p-2 sm:p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${stat.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sales Trend */}
      <div className="rounded-xl border border-brand-green/10 bg-white/90 p-4 sm:p-6 shadow-sm backdrop-blur">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div>
            <h2 className="font-serif text-base sm:text-lg text-brand-green flex items-center gap-2">
              <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-brand-green/70" />
              Sales Overview
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Last 7 business days
            </p>
          </div>
        </div>
        <div className="w-full overflow-x-auto">
          <div className="min-w-[500px]">
            <SalesTrendChart data={trendData} />
          </div>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid gap-6 lg:gap-8 grid-cols-1 lg:grid-cols-2">
        {/* Active Shifts */}
        <div>
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <h2 className="font-serif text-base sm:text-lg text-brand-green flex items-center gap-2">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-brand-green/70" />
              Active shifts
            </h2>
            {activeShifts.length > 0 && (
              <span className="text-xs sm:text-sm text-muted-foreground bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full">
                {activeShifts.length} active
              </span>
            )}
          </div>
          <div className="divide-y rounded-xl border border-brand-green/10 bg-white/90 shadow-sm backdrop-blur">
            {activeShifts.map((shift) => (
              <Link
                key={shift.id}
                href={`/admin/sales/${shift.id}`}
                className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-3 sm:py-4 text-sm hover:bg-brand-green/5 transition-colors group"
              >
                <div className="flex items-center gap-3 mb-1 sm:mb-0">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-medium">{shift.assistantName}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground ml-5 sm:ml-0">
                  <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>Since {shift.startedAt.toLocaleTimeString()}</span>
                  <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
            ))}
            {activeShifts.length === 0 && (
              <div className="px-4 py-8 sm:py-12 text-center">
                <Users className="w-8 h-8 sm:w-12 sm:h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm sm:text-base text-muted-foreground">
                  No one is currently clocked in
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Sales assistants can clock in from their devices
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Low Stock */}
        <div>
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <h2 className="font-serif text-base sm:text-lg text-brand-green flex items-center gap-2">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-brand-green/70" />
              Low stock
            </h2>
            {lowStock.length > 0 && (
              <span className="text-xs sm:text-sm bg-amber-50 text-amber-700 px-2 py-1 rounded-full">
                {lowStock.length} items
              </span>
            )}
          </div>
          <div className="divide-y rounded-xl border border-brand-green/10 bg-white/90 shadow-sm backdrop-blur">
            {lowStock.map((item) => (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-3 sm:py-4 text-sm"
              >
                <div className="flex items-center gap-3 mb-1 sm:mb-0">
                  <div className={`w-2 h-2 rounded-full ${
                    item.quantity === 0 ? 'bg-red-500' : 'bg-amber-500'
                  }`} />
                  <span className="font-medium">{item.name}</span>
                </div>
                <span className={`font-medium ml-5 sm:ml-0 ${
                  item.quantity === 0 
                    ? 'text-red-600' 
                    : item.quantity <= 2 
                    ? 'text-amber-600' 
                    : 'text-amber-500'
                }`}>
                  {item.quantity === 0 ? 'Out of stock' : `${item.quantity} left`}
                </span>
              </div>
            ))}
            {lowStock.length === 0 && (
              <div className="px-4 py-8 sm:py-12 text-center">
                <Package className="w-8 h-8 sm:w-12 sm:h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm sm:text-base text-muted-foreground">
                  Everything is well stocked
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Items with {LOW_STOCK_THRESHOLD} or fewer units appear here
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}