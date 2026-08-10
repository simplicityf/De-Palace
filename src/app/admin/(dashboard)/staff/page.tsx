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
    <div className="space-y-6 px-4 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl text-brand-green">
            Sales assistants
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Create and manage the logins used at /sales.
          </p>
        </div>
        <StaffFormDialog trigger={<Button className="w-full sm:w-auto">Add sales assistant</Button>} />
      </div>

      {/* Desktop Table View */}
      <div className="hidden sm:block rounded-xl border border-brand-green/10 bg-white/90 shadow-sm backdrop-blur overflow-x-auto">
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
                <TableCell className="font-medium">{member.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {member.email}
                </TableCell>
                <TableCell>
                  {member.isActive ? (
                    <span className="inline-flex items-center gap-1.5 text-brand-green">
                      <span className="h-2 w-2 rounded-full bg-brand-green" />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                      <span className="h-2 w-2 rounded-full bg-gray-400" />
                      Inactive
                    </span>
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

      {/* Mobile Card View */}
      <div className="sm:hidden space-y-4">
        {staff.length === 0 ? (
          <div className="rounded-xl border border-brand-green/10 bg-white/90 shadow-sm backdrop-blur p-6 text-center text-muted-foreground">
            No sales assistants yet.
          </div>
        ) : (
          staff.map((member) => (
            <div
              key={member.id}
              className="rounded-xl border border-brand-green/10 bg-white/90 shadow-sm backdrop-blur p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-medium truncate">{member.name}</h3>
                  <p className="text-sm text-muted-foreground truncate">
                    {member.email}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  {member.isActive ? (
                    <span className="inline-flex items-center gap-1.5 text-sm text-brand-green">
                      <span className="h-2 w-2 rounded-full bg-brand-green" />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                      <span className="h-2 w-2 rounded-full bg-gray-400" />
                      Inactive
                    </span>
                  )}
                </div>
              </div>

              <div className="text-xs text-muted-foreground">
                Added {member.createdAt.toLocaleDateString()}
              </div>

              <div className="flex items-center gap-2 pt-2 border-t">
                <StaffFormDialog
                  staff={member}
                  trigger={
                    <Button size="sm" variant="outline" className="flex-1">
                      Edit
                    </Button>
                  }
                />
                <ToggleStaffButton id={member.id} isActive={member.isActive} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}