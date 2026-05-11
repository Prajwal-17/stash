import { LoginForm } from "@/components/login-form";

export default async function LoginPage() {

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#141414] px-6 py-12">
      <div className="w-full max-w-md">
        <LoginForm />
      </div>
    </main>
  );
}
