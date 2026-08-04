"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { shiftReports, shifts, users } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { getShiftReportData } from "@/lib/reports/shift-report-data";
import { renderShiftReportPdf } from "@/lib/pdf/shift-report";
import { sendEmailWithAttachment } from "@/lib/email";
import { formatNaira } from "@/lib/currency";

async function requireSales() {
  const session = await auth();
  if (session?.user?.role !== "sales") {
    throw new Error("Unauthorized");
  }
  return session.user;
}

export async function startShift() {
  const user = await requireSales();

  const [existing] = await db
    .select({ id: shifts.id })
    .from(shifts)
    .where(and(eq(shifts.salesAssistantId, user.id), eq(shifts.status, "active")))
    .limit(1);

  if (!existing) {
    await db.insert(shifts).values({ salesAssistantId: user.id });
  }

  revalidatePath("/sales");
  redirect("/sales");
}

export async function endShift(shiftId: string) {
  const user = await requireSales();

  await db
    .update(shifts)
    .set({ status: "ended", endedAt: new Date() })
    .where(and(eq(shifts.id, shiftId), eq(shifts.salesAssistantId, user.id)));

  revalidatePath("/sales");
  revalidatePath("/sales/sales");

  await emailShiftReport(shiftId, user.email!);

  redirect(`/sales/shift/${shiftId}/summary`);
}

async function emailShiftReport(shiftId: string, assistantEmail: string) {
  const data = await getShiftReportData(shiftId);
  if (!data) return;

  const admins = await db
    .select({ email: users.email })
    .from(users)
    .where(and(eq(users.role, "admin"), eq(users.isActive, true)));

  const recipients = [...new Set([assistantEmail, ...admins.map((a) => a.email)])];

  const pdf = await renderShiftReportPdf(data);
  const dateLabel = data.endedAt.toLocaleDateString();

  const { sent } = await sendEmailWithAttachment({
    to: recipients,
    subject: `DePalace shift report — ${data.assistantName} — ${dateLabel}`,
    text: `Shift by ${data.assistantName} on ${dateLabel}.\nTotal sales: ${formatNaira(
      data.totalSalesAmount,
    )}\n\nFull breakdown attached as PDF.`,
    attachment: {
      filename: `depalace-shift-${dateLabel}.pdf`,
      content: pdf,
    },
  });

  await db.insert(shiftReports).values({
    shiftId,
    totalSalesAmount: data.totalSalesAmount.toFixed(2),
    pdfEmailedAt: sent ? new Date() : null,
  });
}
