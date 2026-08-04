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
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-2xl text-brand-green">{shift.assistantName}</h1>
        <p className="text-muted-foreground">{shift.assistantEmail}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Clock in: {shift.startedAt.toLocaleString()}
          <br />
          Clock out: {shift.endedAt ? shift.endedAt.toLocaleString() : "Still active"}
        </p>
        <p className="mt-2 font-serif text-2xl text-brand-green">
          {formatNaira(total)}
        </p>
      </div>

      <div>
        <h2 className="mb-2 font-serif text-lg text-brand-green">Sales</h2>
        <div className="divide-y rounded-xl border border-brand-green/10 bg-white/90 shadow-sm backdrop-blur">
          {shiftSales.map((sale) => (
            <div key={sale.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <span>
                {sale.quantitySold} × {sale.itemName}
              </span>
              <span className="text-muted-foreground">{formatNaira(sale.totalAmount)}</span>
            </div>
          ))}
          {shiftSales.length === 0 && (
            <p className="px-4 py-6 text-center text-muted-foreground">
              No sales recorded.
            </p>
          )}
        </div>
      </div>

      <div>
        <h2 className="mb-2 font-serif text-lg text-brand-green">Stock at time of viewing</h2>
        <div className="divide-y rounded-xl border border-brand-green/10 bg-white/90 shadow-sm backdrop-blur">
          {remainingStock.map((item) => (
            <div key={item.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <span>
                {item.name}{" "}
                <span className="text-muted-foreground">({item.categoryName})</span>
              </span>
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
