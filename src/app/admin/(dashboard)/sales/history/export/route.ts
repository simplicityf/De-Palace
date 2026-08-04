import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, gte, lt } from "drizzle-orm";
import { db } from "@/lib/db";
import { items, sales, shifts, users } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { formatNaira } from "@/lib/currency";

function csvCell(value: string) {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const staffFilter = searchParams.get("staff") ?? undefined;
  const from = searchParams.get("from") ?? undefined;
  const to = searchParams.get("to") ?? undefined;

  const conditions = [];
  if (staffFilter) conditions.push(eq(shifts.salesAssistantId, staffFilter));
  if (from) conditions.push(gte(sales.soldAt, new Date(`${from}T00:00:00`)));
  if (to) {
    const end = new Date(`${to}T00:00:00`);
    end.setDate(end.getDate() + 1);
    conditions.push(lt(sales.soldAt, end));
  }

  const rows = await db
    .select({
      soldAt: sales.soldAt,
      assistantName: users.name,
      itemName: items.name,
      quantitySold: sales.quantitySold,
      totalAmount: sales.totalAmount,
    })
    .from(sales)
    .innerJoin(items, eq(sales.itemId, items.id))
    .innerJoin(shifts, eq(sales.shiftId, shifts.id))
    .innerJoin(users, eq(shifts.salesAssistantId, users.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(sales.soldAt));

  const grandTotal = rows.reduce((sum, row) => sum + Number(row.totalAmount), 0);

  const header = ["Date", "Staff", "Item", "Qty", "Total"];
  const lines = [header.map(csvCell).join(",")];

  for (const row of rows) {
    lines.push(
      [
        row.soldAt.toLocaleString(),
        row.assistantName,
        row.itemName,
        String(row.quantitySold),
        formatNaira(row.totalAmount),
      ]
        .map((value) => csvCell(value))
        .join(","),
    );
  }
  lines.push(["", "", "", "Grand total", formatNaira(grandTotal)].map(csvCell).join(","));

  const csv = lines.join("\n");
  const filename = `depalace-sales-history-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
