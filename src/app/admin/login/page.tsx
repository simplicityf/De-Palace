import { LoginForm } from "@/components/login-form";
import { loginAdmin } from "@/lib/actions/auth";

export default function AdminLoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-brand-cream p-6">
      <LoginForm
        action={loginAdmin}
        title="Admin Login"
        subtitle="DePalace administration"
      />
    </div>
  );
}
