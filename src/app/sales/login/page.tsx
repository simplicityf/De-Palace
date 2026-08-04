import { LoginForm } from "@/components/login-form";
import { loginSales } from "@/lib/actions/auth";

export default function SalesLoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-brand-cream p-6">
      <LoginForm
        action={loginSales}
        title="Sales Login"
        subtitle="Clock in and start your shift"
      />
    </div>
  );
}
