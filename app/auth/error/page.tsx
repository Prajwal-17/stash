import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default async function Page({
  searchParams
}: {
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  const params = await searchParams;
  const errorCode = Array.isArray(params.error) ? params.error[0] : params.error;

  return (
    <main className="bg-background flex min-h-dvh w-full items-center justify-center px-4 py-8 sm:p-6 md:p-10">
      <div className="w-full max-w-md">
        <div className="flex flex-col gap-6">
          <Card className="overflow-hidden shadow-2xl shadow-black/30">
            <CardHeader>
              <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                Authentication
              </p>
              <CardTitle className="text-2xl leading-tight">We couldn’t sign you in.</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {errorCode ? (
                <p role="alert" className="text-muted-foreground text-sm break-all">
                  Error code: {errorCode}
                </p>
              ) : (
                <p role="alert" className="text-muted-foreground text-sm">
                  The sign-in request could not be completed. Please try again.
                </p>
              )}
              <Button asChild className="min-h-11 w-full">
                <Link href="/auth/login">Try signing in again</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
