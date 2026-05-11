"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function LogoutButton() {
  const router = useRouter();

  const logout = async () => {
    await authClient.signOut();
    router.push("/auth/login");
  };

  return <Button onClick={logout}>Logout</Button>;
}
