import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { categories, items, sales, shifts, users } from "@/lib/db/schema";
import { formatNaira } from "@/lib/currency";

export default async function AdminShiftDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [shift] = await db
    .select({
      id: shifts.id,
      startedAt: shifts.startedAt,
      endedAt: shifts.endedAt,
      status: shifts.status,
      assistantName: users.name,
      assistantEmail: users.email,
    })
    .from(shifts)
    .innerJoin(users, eq(shifts.salesAssistantId, users.id))
    .where(eq(shifts.id, id))
    .limit(1);

  if (!shift) notFound();

  const [shiftSales, remainingStock] = await Promise.all([
    db
      .select({
        id: sales.id,
        itemName: items.name,
        quantitySold: sales.quantitySold,
        totalAmount: sales.totalAmount,
        soldAt: sales.soldAt,
      })
      .from(sales)
      .innerJoin(items, eq(sales.itemId, items.id))
      .where(eq(sales.shiftId, shift.id)),
    db
      .select({
        id: items.id,
        name: items.name,
        categoryName: categories.name,
        quantity: items.quantity,
      })
      .from(items)
      .innerJoin(categories, eq(items.categoryId, categories.id))
      .where(eq(items.isArchived, false))
      .orderBy(categories.name, items.name),
  ]);

  const total = shiftSales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0);

  return (
    <div className="space-y-6 sm:space-y-8 px-4 sm:px-0">
      {/* Shift Header */}
      <div className="rounded-xl border border-brand-green/10 bg-white/90 shadow-sm backdrop-blur p-4 sm:p-6 space-y-4">
        <div>
          <h1 className="font-serif text-xl sm:text-2xl text-brand-green">
            {shift.assistantName}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground truncate">
            {shift.assistantEmail}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">Clock in:</span>
              <span>{shift.startedAt.toLocaleString([], {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">Clock out:</span>
              <span>
                {shift.endedAt
                  ? shift.endedAt.toLocaleString([], {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "Still active"}
              </span>
            </div>
          </div>
          <div className="sm:text-right">
            <p className="text-sm text-muted-foreground">Total sales</p>
            <p className="font-serif text-xl sm:text-2xl text-brand-green">
              {formatNaira(total)}
            </p>
          </div>
        </div>
      </div>

      {/* Sales Section */}
      <div>
        <h2 className="mb-3 sm:mb-2 font-serif text-lg sm:text-xl text-brand-green">
          Sales
        </h2>
        <div className="divide-y rounded-xl border border-brand-green/10 bg-white/90 shadow-sm backdrop-blur">
          {shiftSales.length > 0 ? (
            shiftSales.map((sale) => (
              <div
                key={sale.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 py-3 sm:py-3 gap-1 sm:gap-0 text-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                  <span className="font-medium">
                    {sale.quantitySold} × {sale.itemName}
                  </span>
                  <span className="text-xs text-muted-foreground sm:hidden">
                    {sale.soldAt.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div className="flex items-center justify-between sm:justify-end sm:gap-4">
                  <span className="hidden sm:inline text-xs text-muted-foreground">
                    {sale.soldAt.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <span className="font-medium text-brand-green">
                    {formatNaira(sale.totalAmount)}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="px-4 py-6 sm:py-8 text-center text-muted-foreground">
              No sales recorded.
            </p>
          )}
          {shiftSales.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 bg-brand-green/5 font-medium">
              <span>Total</span>
              <span className="text-brand-green">{formatNaira(total)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Stock Section */}
      <div>
        <h2 className="mb-3 sm:mb-2 font-serif text-lg sm:text-xl text-brand-green">
          Stock at time of viewing
        </h2>
        <div className="divide-y rounded-xl border border-brand-green/10 bg-white/90 shadow-sm backdrop-blur">
          {remainingStock.map((item) => (
            <div
              key={item.id}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 py-3 gap-1 sm:gap-0 text-sm"
            >
              <div className="min-w-0">
                <span className="truncate">{item.name}</span>{" "}
                <span className="text-muted-foreground text-xs sm:text-sm">
                  ({item.categoryName})
                </span>
              </div>
              <span
                className={`text-sm font-medium ${
                  item.quantity > 0 ? "text-muted-foreground" : "text-red-500"
                }`}
              >
                {item.quantity > 0 ? `${item.quantity} left` : "Sold out"}
              </span>
            </div>
          ))}
          {remainingStock.length === 0 && (
            <p className="px-4 py-6 sm:py-8 text-center text-muted-foreground">
              No items in stock.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}