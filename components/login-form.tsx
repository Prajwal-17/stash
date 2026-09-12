"use client";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "motion/react";
import { ComponentPropsWithoutRef, FormEvent, useEffect, useRef, useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { LuLoaderCircle } from "react-icons/lu";

export function LoginForm({ className, ...props }: ComponentPropsWithoutRef<"div">) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const errorRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);

  const handleGoogleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await authClient.signIn.social({
        provider: "google",
        callbackURL: "/"
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
      <div className="border-border bg-card text-card-foreground rounded-lg p-6 sm:p-8">
        <div className="relative">
          <p className="text-foreground text-lg font-semibold tracking-tight">Stash</p>
          <h1 className="text-foreground mt-6 text-xl font-semibold tracking-tight">
            Welcome back
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Your links, saved and organized in one place.
          </p>
        </div>

        <form onSubmit={handleGoogleLogin} className="mt-6" aria-busy={isLoading}>
          <AnimatePresence>
            {error ? (
              <motion.p
                ref={errorRef}
                role="alert"
                tabIndex={-1}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="border-destructive/30 bg-destructive/10 text-destructive mb-4 rounded-lg border px-3 py-2 text-sm wrap-break-word focus:outline-none"
              >
                {error}
              </motion.p>
            ) : null}
          </AnimatePresence>

          <Button
            type="submit"
            className="h-10 w-full gap-3 rounded-lg px-4 text-sm font-semibold"
            disabled={isLoading}
          >
            {isLoading ? (
              <LuLoaderCircle size={18} className="animate-spin" />
            ) : (
              <FcGoogle className="h-5 w-5" />
            )}
            {isLoading ? "Redirecting..." : "Continue with Google"}
          </Button>
        </form>

        <div className="text-muted-foreground mt-5 flex items-center justify-center gap-2 text-xs">
          <span>Sign in to access your personal stash.</span>
        </div>
      </div>
    </div>
  );
}
