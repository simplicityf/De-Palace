import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { categories, items, sales, shifts, users } from "@/lib/db/schema";
import type { ShiftReportData } from "@/lib/pdf/shift-report";

export async function getShiftReportData(
  shiftId: string,
): Promise<ShiftReportData | null> {
  const [shift] = await db
    .select({
      startedAt: shifts.startedAt,
      endedAt: shifts.endedAt,
      assistantName: users.name,
      assistantEmail: users.email,
    })
    .from(shifts)
    .innerJoin(users, eq(shifts.salesAssistantId, users.id))
    .where(eq(shifts.id, shiftId))
    .limit(1);

  if (!shift || !shift.endedAt) return null;

  const [shiftSales, remainingStock] = await Promise.all([
    db
      .select({
        itemName: items.name,
        quantitySold: sales.quantitySold,
        unitPriceAtSale: sales.unitPriceAtSale,
        totalAmount: sales.totalAmount,
      })
      .from(sales)
      .innerJoin(items, eq(sales.itemId, items.id))
      .where(eq(sales.shiftId, shiftId)),
    db
      .select({
        itemName: items.name,
        categoryName: categories.name,
        quantity: items.quantity,
      })
      .from(items)
      .innerJoin(categories, eq(items.categoryId, categories.id))
      .where(eq(items.isArchived, false))
      .orderBy(categories.name, items.name),
  ]);

  const totalSalesAmount = shiftSales.reduce(
    (sum, sale) => sum + Number(sale.totalAmount),
    0,
  );

  return {
    assistantName: shift.assistantName,
    startedAt: shift.startedAt,
    endedAt: shift.endedAt,
    totalSalesAmount,
    sales: shiftSales.map((sale) => ({
      itemName: sale.itemName,
      quantitySold: sale.quantitySold,
      unitPrice: Number(sale.unitPriceAtSale),
      totalAmount: Number(sale.totalAmount),
    })),
    remainingStock,
  };
}
