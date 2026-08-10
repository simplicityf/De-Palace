import { auth } from "@/lib/auth";
import { ChangePasswordForm } from "@/components/admin/change-password-form";

export default async function AccountPage() {
  const session = await auth();

  return (
    <div className="space-y-6 px-4 sm:px-0">
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl text-brand-green">
          Account
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground break-all">
          {session?.user?.email}
        </p>
      </div>

      <div className="w-full sm:max-w-md rounded-xl border border-brand-green/10 bg-white/90 p-4 sm:p-6 shadow-sm backdrop-blur">
        <h2 className="mb-4 font-serif text-lg sm:text-xl text-brand-green">
          Change password
        </h2>
        <ChangePasswordForm />
      </div>
    </div>
  );
}