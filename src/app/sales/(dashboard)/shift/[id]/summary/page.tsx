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
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="rounded-lg border bg-card p-6 text-center">
        <p className="text-sm text-muted-foreground">Shift complete</p>
        <p className="font-serif text-3xl text-brand-green">
          {formatNaira(data.totalSalesAmount)}
        </p>
        <p className="text-sm text-muted-foreground">
          {data.startedAt.toLocaleString()} – {data.endedAt.toLocaleString()}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          A PDF copy of this summary has been emailed to you and the admin.
        </p>
      </div>

      <div>
        <h2 className="mb-2 font-serif text-lg">Sales this shift</h2>
        <div className="divide-y rounded-lg border bg-card">
          {data.sales.map((sale, index) => (
            <div key={index} className="flex items-center justify-between px-4 py-3 text-sm">
              <span>
                {sale.quantitySold} × {sale.itemName}
              </span>
              <span className="text-muted-foreground">{formatNaira(sale.totalAmount)}</span>
            </div>
          ))}
          {data.sales.length === 0 && (
            <p className="px-4 py-6 text-center text-muted-foreground">
              No sales were recorded this shift.
            </p>
          )}
        </div>
      </div>

      <div>
        <h2 className="mb-2 font-serif text-lg">Stock remaining</h2>
        <div className="divide-y rounded-lg border bg-card">
          {data.remainingStock.map((item, index) => (
            <div key={index} className="flex items-center justify-between px-4 py-3 text-sm">
              <span>{item.itemName}</span>
              <span className="text-muted-foreground">
                {item.quantity > 0 ? `${item.quantity} left` : "Sold out"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
