"use client";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "motion/react";
import { ComponentPropsWithoutRef, useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { LuArrowRight, LuLoaderCircle, LuShieldCheck } from "react-icons/lu";

export function LoginForm({
  className,
  ...props
}: ComponentPropsWithoutRef<"div">) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await authClient.signIn.social({
        provider: "google",
        callbackURL: "/",
      });

      if (error) {
        setError(error.message || "An error occurred");
        setIsLoading(false);
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="border-border bg-card text-card-foreground relative overflow-hidden rounded-2xl border p-6 shadow-2xl shadow-black/30 sm:p-8">
        <div className="bg-muted pointer-events-none absolute -top-16 -right-20 h-48 w-48 rounded-full blur-2xl" />
        <div className="relative">
          <p className="text-muted-foreground text-sm font-semibold tracking-wide">
            STASH
          </p>
          <h1 className="text-foreground mt-3 text-2xl font-semibold sm:text-3xl">
            Welcome back
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Sign in with Google to access your stash securely.
          </p>
          <p className="text-muted-foreground mt-1 text-xs">
            Stash is a lightweight personal link manager for saving and
            organizing links.
          </p>
        </div>

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
            className="group bg-primary text-primary-foreground hover:bg-primary/90 h-12 w-full rounded-xl px-4 text-sm font-semibold shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            disabled={isLoading}
          >
            {isLoading ? (
              <LuLoaderCircle size={18} className="animate-spin" />
            ) : (
              <FcGoogle className="h-5 w-5" />
            )}
            {isLoading ? "Redirecting..." : "Continue with Google"}
            {!isLoading ? (
              <LuArrowRight
                size={16}
                className="ml-auto opacity-60 transition-transform group-hover:translate-x-1"
              />
            ) : null}
          </Button>
        </form>

        <div className="text-muted-foreground mt-5 flex items-center justify-center gap-2 text-xs">
          <LuShieldCheck size={14} />
          <span>Google OAuth secured login</span>
        </div>
      </div>
    </div>
  );
}
