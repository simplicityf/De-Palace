import { and, eq, gte, lt, notInArray, sql, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { categories, items, sales, shifts } from "@/lib/db/schema";
import { businessDateStart, businessMonthRange } from "@/lib/date-range";

type RawParams = Record<string, string | string[] | undefined>;

export type SalesFilters = {
  staff?: string;
  from?: string;
  to?: string;
  excludeItems: string[];
  excludeCategories: string[];
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function all(value: string | string[] | undefined) {
  return Array.isArray(value) ? value : value ? [value] : [];
}

export function rawParamsFromURL(searchParams: URLSearchParams): RawParams {
  const raw: RawParams = {};
  for (const key of new Set(searchParams.keys())) {
    raw[key] = searchParams.getAll(key);
  }
  return raw;
}

/**
 * Reads filters from the query string, dropping malformed values so they
 * can't reach Postgres. With no from/to in the URL at all, defaults to the
 * current month; submitting both dates empty means "all time".
 */
export function parseSalesFilters(raw: RawParams): SalesFilters {
  const staff = first(raw.staff);
  const from = first(raw.from);
  const to = first(raw.to);
  const hasDates = "from" in raw || "to" in raw;
  const month = businessMonthRange(0);

  return {
    staff: staff && UUID_RE.test(staff) ? staff : undefined,
    from: hasDates ? (from && DATE_RE.test(from) ? from : undefined) : month.from,
    to: hasDates ? (to && DATE_RE.test(to) ? to : undefined) : month.to,
    excludeItems: all(raw.xItem).filter((id) => UUID_RE.test(id)),
    excludeCategories: all(raw.xCat).filter((id) => UUID_RE.test(id)),
  };
}

export function salesFiltersToParams(filters: SalesFilters) {
  const params = new URLSearchParams();
  if (filters.staff) params.set("staff", filters.staff);
  // Always emitted (possibly empty) so "all time" survives pagination links.
  params.set("from", filters.from ?? "");
  params.set("to", filters.to ?? "");
  for (const id of filters.excludeItems) params.append("xItem", id);
  for (const id of filters.excludeCategories) params.append("xCat", id);
  return params;
}

/** WHERE clause for queries over `sales` joined to `items` and (left) `shifts`. */
export function salesWhere(filters: SalesFilters): SQL | undefined {
  const conditions: SQL[] = [];
  if (filters.staff) conditions.push(eq(shifts.salesAssistantId, filters.staff));
  if (filters.from) conditions.push(gte(sales.soldAt, businessDateStart(filters.from)));
  if (filters.to) {
    const end = new Date(businessDateStart(filters.to).getTime() + 24 * 60 * 60 * 1000);
    conditions.push(lt(sales.soldAt, end));
  }
  if (filters.excludeItems.length > 0) {
    conditions.push(notInArray(sales.itemId, filters.excludeItems));
  }
  if (filters.excludeCategories.length > 0) {
    conditions.push(notInArray(items.categoryId, filters.excludeCategories));
  }
  return conditions.length > 0 ? and(...conditions) : undefined;
}

// Cost per unit for a sale: the snapshot taken at sale time, falling back to
// the item's current original price for sales recorded before one was set.
// Requires `items` to be joined.
export const unitCostSql = sql`coalesce(${sales.costPriceAtSale}, ${items.costPrice})`;

// Profit only exists for sales with a known cost; SUM skips the NULL rows,
// and `uncostedCountSql` reports how many were skipped.
export const profitSql = sql<string>`coalesce(sum((${sales.unitPriceAtSale} - ${unitCostSql}) * ${sales.quantitySold}), 0)`;
export const uncostedCountSql = sql<number>`(count(*) filter (where ${unitCostSql} is null))::int`;
const costedSalesSql = sql<string>`coalesce(sum(${sales.totalAmount}) filter (where ${unitCostSql} is not null), 0)`;

export async function getSalesSummary(filters: SalesFilters) {
  const [row] = await db
    .select({
      count: sql<number>`count(*)::int`,
      unitsSold: sql<number>`coalesce(sum(${sales.quantitySold}), 0)::int`,
      salesTotal: sql<string>`coalesce(sum(${sales.totalAmount}), 0)`,
      costedSalesTotal: costedSalesSql,
      profit: profitSql,
      uncostedCount: uncostedCountSql,
    })
    .from(sales)
    .innerJoin(items, eq(sales.itemId, items.id))
    .leftJoin(shifts, eq(sales.shiftId, shifts.id))
    .where(salesWhere(filters));

  const profit = Number(row.profit);
  const costedSalesTotal = Number(row.costedSalesTotal);
  return {
    count: row.count,
    unitsSold: row.unitsSold,
    salesTotal: Number(row.salesTotal),
    costedSalesTotal,
    profit,
    margin: costedSalesTotal > 0 ? profit / costedSalesTotal : null,
    uncostedCount: row.uncostedCount,
  };
}

/** Non-archived items grouped by category, for the exclude filter. */
export async function getExcludeOptions() {
  const rows = await db
    .select({
      id: items.id,
      name: items.name,
      categoryId: categories.id,
      categoryName: categories.name,
    })
    .from(items)
    .innerJoin(categories, eq(items.categoryId, categories.id))
    .where(eq(items.isArchived, false))
    .orderBy(categories.name, items.name);

  const groups = new Map<string, { id: string; name: string; items: { id: string; name: string }[] }>();
  for (const row of rows) {
    const group = groups.get(row.categoryId) ?? { id: row.categoryId, name: row.categoryName, items: [] };
    group.items.push({ id: row.id, name: row.name });
    groups.set(row.categoryId, group);
  }
  return [...groups.values()];
}
