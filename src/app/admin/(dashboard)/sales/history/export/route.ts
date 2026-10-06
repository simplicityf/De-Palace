import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/lib/db";
import { items, sales, shifts, users } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { formatNaira } from "@/lib/currency";
import {
  getSalesSummary,
  parseSalesFilters,
  rawParamsFromURL,
  salesWhere,
} from "@/lib/reports/sales-filters";

const recordedByUser = alias(users, "recorded_by_user");

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
  const filters = parseSalesFilters(rawParamsFromURL(searchParams));

  const summaryPromise = getSalesSummary(filters);
  const rows = await db
    .select({
      soldAt: sales.soldAt,
      shiftAssistantName: users.name,
      recordedByName: recordedByUser.name,
      itemName: items.name,
      quantitySold: sales.quantitySold,
      totalAmount: sales.totalAmount,
    })
    .from(sales)
    .innerJoin(items, eq(sales.itemId, items.id))
    .leftJoin(shifts, eq(sales.shiftId, shifts.id))
    .leftJoin(users, eq(shifts.salesAssistantId, users.id))
    .leftJoin(recordedByUser, eq(sales.recordedByUserId, recordedByUser.id))
    .where(salesWhere(filters))
    .orderBy(desc(sales.soldAt));

  const summary = await summaryPromise;

  const header = ["Date", "Staff", "Item", "Qty", "Total"];
  const lines = [header.map(csvCell).join(",")];

  for (const row of rows) {
    const staffLabel =
      row.shiftAssistantName ?? (row.recordedByName ? `${row.recordedByName} (Admin)` : "Admin");
    lines.push(
      [
        row.soldAt.toLocaleString(),
        staffLabel,
        row.itemName,
        String(row.quantitySold),
        formatNaira(row.totalAmount),
      ]
        .map((value) => csvCell(value))
        .join(","),
    );
  }
  lines.push(["", "", "", "Grand total", formatNaira(summary.salesTotal)].map(csvCell).join(","));
  lines.push(["", "", "", "Revenue (profit)", formatNaira(summary.profit)].map(csvCell).join(","));

  const csv = lines.join("\n");
  const filename = `depalace-sales-history-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
