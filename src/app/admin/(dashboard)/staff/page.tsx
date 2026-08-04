import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StaffFormDialog } from "@/components/admin/staff-form-dialog";
import { ToggleStaffButton } from "@/components/admin/toggle-staff-button";

export default async function StaffPage() {
  const staff = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      isActive: users.isActive,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.role, "sales"))
    .orderBy(users.createdAt);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl text-brand-green">Sales assistants</h1>
          <p className="text-muted-foreground">
            Create and manage the logins used at /sales.
          </p>
        </div>
        <StaffFormDialog trigger={<Button>Add sales assistant</Button>} />
      </div>

      <div className="rounded-xl border border-brand-green/10 bg-white/90 shadow-sm backdrop-blur">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Added</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staff.map((member) => (
              <TableRow key={member.id}>
                <TableCell>{member.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {member.email}
                </TableCell>
                <TableCell>
                  {member.isActive ? (
                    <span className="text-brand-green">Active</span>
                  ) : (
                    <span className="text-muted-foreground">Inactive</span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {member.createdAt.toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right space-x-1">
                  <StaffFormDialog
                    staff={member}
                    trigger={
                      <Button size="sm" variant="outline">
                        Edit
                      </Button>
                    }
                  />
                  <ToggleStaffButton id={member.id} isActive={member.isActive} />
                </TableCell>
              </TableRow>
            ))}
            {staff.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-6 text-center text-muted-foreground">
                  No sales assistants yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
