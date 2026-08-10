import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { shifts } from "@/lib/db/schema";
import { getShiftReportData } from "@/lib/reports/shift-report-data";
import { formatNaira } from "@/lib/currency";

export default async function ShiftSummaryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const userId = session!.user.id;

  const [shift] = await db
    .select({ id: shifts.id })
    .from(shifts)
    .where(and(eq(shifts.id, id), eq(shifts.salesAssistantId, userId)))
    .limit(1);

  if (!shift) notFound();

  const data = await getShiftReportData(shift.id);
  if (!data) notFound();

  return (
    <div className="mx-auto w-full sm:max-w-2xl space-y-6 sm:space-y-8 px-4 sm:px-0">
      {/* Shift Complete Header */}
      <div className="rounded-lg border bg-card p-4 sm:p-6 text-center">
        <p className="text-sm text-muted-foreground">Shift complete</p>
        <p className="font-serif text-2xl sm:text-3xl text-brand-green mt-1">
          {formatNaira(data.totalSalesAmount)}
        </p>
        <div className="mt-2 space-y-1">
          <p className="text-sm text-muted-foreground">
            <span className="block sm:inline">
              {data.startedAt.toLocaleString([], {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            <span className="hidden sm:inline"> – </span>
            <span className="block sm:inline">
              {data.endedAt.toLocaleString([], {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </p>
        </div>
        <p className="mt-2 sm:mt-3 text-xs text-muted-foreground">
          A PDF copy of this summary has been emailed to you and the admin.
        </p>
      </div>

      {/* Sales This Shift */}
      <div>
        <h2 className="mb-2 sm:mb-3 font-serif text-lg sm:text-xl">
          Sales this shift
        </h2>
        <div className="divide-y rounded-lg border bg-card">
          {data.sales.length > 0 ? (
            data.sales.map((sale, index) => (
              <div
                key={index}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 py-3 gap-1 sm:gap-0 text-sm"
              >
                <span className="font-medium">
                  {sale.quantitySold} × {sale.itemName}
                </span>
                <span className="text-muted-foreground sm:text-right">
                  {formatNaira(sale.totalAmount)}
                </span>
              </div>
            ))
          ) : (
            <p className="px-4 py-6 sm:py-8 text-center text-muted-foreground">
              No sales were recorded this shift.
            </p>
          )}
          {data.sales.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 bg-muted/30 font-medium">
              <span>Total</span>
              <span className="text-brand-green">
                {formatNaira(data.totalSalesAmount)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Stock Remaining */}
      <div>
        <h2 className="mb-2 sm:mb-3 font-serif text-lg sm:text-xl">
          Stock remaining
        </h2>
        <div className="divide-y rounded-lg border bg-card">
          {data.remainingStock.map((item, index) => (
            <div
              key={index}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 py-3 gap-1 sm:gap-0 text-sm"
            >
              <span className="font-medium truncate">{item.itemName}</span>
              <span
                className={
                  item.quantity > 0
                    ? "text-muted-foreground"
                    : "text-red-500 font-medium"
                }
              >
                {item.quantity > 0 ? `${item.quantity} left` : "Sold out"}
              </span>
            </div>
          ))}
          {data.remainingStock.length === 0 && (
            <p className="px-4 py-6 sm:py-8 text-center text-muted-foreground">
              No stock information available.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}