"use client";

import { Chrome } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { ComponentPropsWithoutRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function LoginForm({
  className,
  ...props
}: ComponentPropsWithoutRef<"div">) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/v1/callback?next=/`,
        },
      });

      if (error) throw error;
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="rounded-xl border border-neutral-800 bg-[#1a1a1a] p-6 sm:p-7">
        <p className="text-sm font-medium text-neutral-100">Stash</p>
        <h1 className="mt-2 text-2xl font-medium text-white">
          Sign in with Google
        </h1>
        <p className="mt-2 text-sm text-neutral-500">
          Open your personal bookmark manager.
        </p>

        <form onSubmit={handleGoogleLogin} className="mt-6">
          <AnimatePresence>
            {error ? (
              <motion.p
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-100"
              >
                {error}
              </motion.p>
            ) : null}
          </AnimatePresence>

          <Button
            type="submit"
            className="h-11 w-full rounded-lg bg-neutral-100 px-4 text-sm font-medium text-black hover:bg-white"
            disabled={isLoading}
          >
            <Chrome size={18} />
            {isLoading ? "Redirecting..." : "Continue with Google"}
          </Button>
        </form>
      </div>
    </div>
  );
}
