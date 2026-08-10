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

// Notes stay visible/editable for as long as they exist, regardless of
// whether the shift that created them has since ended — only ownership
// (this note belongs to one of *my* shifts) is required.
async function requireOwnNote(noteId: string) {
  const session = await auth();
  if (session?.user?.role !== "sales") {
    throw new Error("Unauthorized");
  }

  const [note] = await db
    .select({ id: saleNotes.id })
    .from(saleNotes)
    .innerJoin(shifts, eq(saleNotes.shiftId, shifts.id))
    .where(and(eq(saleNotes.id, noteId), eq(shifts.salesAssistantId, session.user.id)))
    .limit(1);

  if (!note) throw new Error("Note not found.");
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

function revalidateNotePaths() {
  revalidatePath("/sales/sales");
  revalidatePath("/sales/notes");
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

  revalidateNotePaths();
  return {};
}

export async function updateSaleNote(
  id: string,
  _prevState: SaleNoteFormState,
  formData: FormData,
): Promise<SaleNoteFormState> {
  await requireOwnNote(id);

  const tableNumber = (formData.get("tableNumber") as string | null)?.trim();
  const isPaid = formData.get("isPaid") === "paid";
  const parsedLines = parseLineItems(formData.get("items") as string | null);

  if (!tableNumber) return { error: "Table number is required." };
  if ("error" in parsedLines) return parsedLines;

  const resolvedLines = await resolveLineItems(parsedLines);

  await db.update(saleNotes).set({ tableNumber, isPaid }).where(eq(saleNotes.id, id));

  await db.delete(saleNoteItems).where(eq(saleNoteItems.noteId, id));
  await db.insert(saleNoteItems).values(
    resolvedLines.map((line) => ({
      noteId: id,
      ...line,
    })),
  );

  revalidateNotePaths();
  return {};
}

export async function setSaleNotePaid(id: string, isPaid: boolean) {
  await requireOwnNote(id);

  await db.update(saleNotes).set({ isPaid }).where(eq(saleNotes.id, id));

  revalidateNotePaths();
}

export async function deleteSaleNote(id: string) {
  await requireOwnNote(id);

  await db.delete(saleNotes).where(eq(saleNotes.id, id));

  revalidateNotePaths();
}
