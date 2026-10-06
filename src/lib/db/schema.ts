import {
  pgTable,
  uuid,
  text,
  numeric,
  integer,
  boolean,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["admin", "sales"]);
export const shiftStatusEnum = pgEnum("shift_status", ["active", "ended"]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const items = pgTable("items", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  categoryId: uuid("category_id")
    .notNull()
    .references(() => categories.id, { onDelete: "restrict" }),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  // Optional purchase cost per unit; profit = price - costPrice.
  costPrice: numeric("cost_price", { precision: 10, scale: 2 }),
  quantity: integer("quantity").notNull().default(0),
  isArchived: boolean("is_archived").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const shifts = pgTable("shifts", {
  id: uuid("id").primaryKey().defaultRandom(),
  salesAssistantId: uuid("sales_assistant_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  startedAt: timestamp("started_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  endedAt: timestamp("ended_at", { withTimezone: true }),
  status: shiftStatusEnum("status").notNull().default("active"),
});

export const sales = pgTable("sales", {
  id: uuid("id").primaryKey().defaultRandom(),
  // Nullable: sales recorded directly by an admin (not tied to a staff
  // shift) have no shiftId — recordedByUserId identifies who logged those.
  shiftId: uuid("shift_id").references(() => shifts.id, {
    onDelete: "restrict",
  }),
  recordedByUserId: uuid("recorded_by_user_id").references(() => users.id, {
    onDelete: "restrict",
  }),
  itemId: uuid("item_id")
    .notNull()
    .references(() => items.id, { onDelete: "restrict" }),
  quantitySold: integer("quantity_sold").notNull(),
  unitPriceAtSale: numeric("unit_price_at_sale", {
    precision: 10,
    scale: 2,
  }).notNull(),
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
  // Snapshot of items.costPrice at sale time, so later cost edits don't
  // rewrite past profit. Null when the item had no cost price set.
  costPriceAtSale: numeric("cost_price_at_sale", { precision: 10, scale: 2 }),
  soldAt: timestamp("sold_at", { withTimezone: true }).notNull().defaultNow(),
});

export const saleNotes = pgTable("sale_notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  shiftId: uuid("shift_id")
    .notNull()
    .references(() => shifts.id, { onDelete: "cascade" }),
  tableNumber: text("table_number").notNull(),
  isPaid: boolean("is_paid").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const saleNoteItems = pgTable("sale_note_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  noteId: uuid("note_id")
    .notNull()
    .references(() => saleNotes.id, { onDelete: "cascade" }),
  itemId: uuid("item_id")
    .notNull()
    .references(() => items.id, { onDelete: "restrict" }),
  itemName: text("item_name").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
});

export const shiftReports = pgTable("shift_reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  shiftId: uuid("shift_id")
    .notNull()
    .unique()
    .references(() => shifts.id, { onDelete: "cascade" }),
  totalSalesAmount: numeric("total_sales_amount", {
    precision: 10,
    scale: 2,
  }).notNull(),
  pdfEmailedAt: timestamp("pdf_emailed_at", { withTimezone: true }),
});
