import { LoginForm } from "@/components/login-form";

export default async function LoginPage() {
  return (
    <main className="bg-background flex min-h-dvh items-center justify-center px-4 py-8 sm:px-6 sm:py-12">
      <div className="w-full max-w-md">
        <LoginForm />
      </div>
    </main>
  );
}
