"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { items, saleNoteItems, saleNotes, shifts } from "@/lib/db/schema";
import { auth } from "@/lib/auth";

async function requireOwnActiveShift(shiftId: string) {
  const session = await auth();
  if (session?.user?.role !== "sales") {
    throw new Error("Unauthorized");
  }

  const [shift] = await db
    .select({ id: shifts.id })
    .from(shifts)
    .where(
      and(
        eq(shifts.id, shiftId),
        eq(shifts.salesAssistantId, session.user.id),
        eq(shifts.status, "active"),
      ),
    )
    .limit(1);

  if (!shift) throw new Error("This shift is no longer active.");
}

export type SaleNoteFormState = { error?: string };

type ParsedLine = { itemId: string; quantity: number };

function parseLineItems(raw: string | null): ParsedLine[] | { error: string } {
  if (!raw) return { error: "Add at least one item." };

  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return { error: "Invalid item data." };
  }

  if (!Array.isArray(data) || data.length === 0) {
    return { error: "Add at least one item." };
  }

  const lines: ParsedLine[] = [];
  for (const entry of data) {
    if (
      !entry ||
      typeof entry !== "object" ||
      typeof (entry as Record<string, unknown>).itemId !== "string" ||
      typeof (entry as Record<string, unknown>).quantity !== "number"
    ) {
      return { error: "Invalid item data." };
    }
    const itemId = (entry as { itemId: string }).itemId;
    const quantity = (entry as { quantity: number }).quantity;
    if (!Number.isInteger(quantity) || quantity <= 0) {
      return { error: "Enter a valid quantity for each item." };
    }
    lines.push({ itemId, quantity });
  }

  return lines;
}

async function resolveLineItems(lines: ParsedLine[]) {
  const itemIds = lines.map((line) => line.itemId);
  const rows = await db
    .select({ id: items.id, name: items.name, price: items.price })
    .from(items)
    .where(inArray(items.id, itemIds));

  const byId = new Map(rows.map((row) => [row.id, row]));

  return lines.map((line) => {
    const item = byId.get(line.itemId);
    if (!item) throw new Error("One of the selected items no longer exists.");
    return {
      itemId: item.id,
      itemName: item.name,
      quantity: line.quantity,
      unitPrice: item.price,
    };
  });
}

export async function createSaleNote(
  shiftId: string,
  _prevState: SaleNoteFormState,
  formData: FormData,
): Promise<SaleNoteFormState> {
  await requireOwnActiveShift(shiftId);

  const tableNumber = (formData.get("tableNumber") as string | null)?.trim();
  const isPaid = formData.get("isPaid") === "paid";
  const parsedLines = parseLineItems(formData.get("items") as string | null);

  if (!tableNumber) return { error: "Table number is required." };
  if ("error" in parsedLines) return parsedLines;

  const resolvedLines = await resolveLineItems(parsedLines);

  const [note] = await db
    .insert(saleNotes)
    .values({ shiftId, tableNumber, isPaid })
    .returning({ id: saleNotes.id });

  await db.insert(saleNoteItems).values(
    resolvedLines.map((line) => ({
      noteId: note.id,
      ...line,
    })),
  );

  revalidatePath("/sales/sales");
  return {};
}

export async function updateSaleNote(
  shiftId: string,
  id: string,
  _prevState: SaleNoteFormState,
  formData: FormData,
): Promise<SaleNoteFormState> {
  await requireOwnActiveShift(shiftId);

  const tableNumber = (formData.get("tableNumber") as string | null)?.trim();
  const isPaid = formData.get("isPaid") === "paid";
  const parsedLines = parseLineItems(formData.get("items") as string | null);

  if (!tableNumber) return { error: "Table number is required." };
  if ("error" in parsedLines) return parsedLines;

  const resolvedLines = await resolveLineItems(parsedLines);

  await db
    .update(saleNotes)
    .set({ tableNumber, isPaid })
    .where(and(eq(saleNotes.id, id), eq(saleNotes.shiftId, shiftId)));

  await db.delete(saleNoteItems).where(eq(saleNoteItems.noteId, id));
  await db.insert(saleNoteItems).values(
    resolvedLines.map((line) => ({
      noteId: id,
      ...line,
    })),
  );

  revalidatePath("/sales/sales");
  return {};
}

export async function setSaleNotePaid(
  shiftId: string,
  id: string,
  isPaid: boolean,
) {
  await requireOwnActiveShift(shiftId);

  await db
    .update(saleNotes)
    .set({ isPaid })
    .where(and(eq(saleNotes.id, id), eq(saleNotes.shiftId, shiftId)));

  revalidatePath("/sales/sales");
}

export async function deleteSaleNote(shiftId: string, id: string) {
  await requireOwnActiveShift(shiftId);

  await db
    .delete(saleNotes)
    .where(and(eq(saleNotes.id, id), eq(saleNotes.shiftId, shiftId)));

  revalidatePath("/sales/sales");
}
