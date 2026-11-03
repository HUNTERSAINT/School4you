"use client";
import { useEffect, useState } from "react";

export type ClientUser = { id: string; name: string; email: string; role: string; schoolId: string; schoolName: string };

export const isAdminRole = (role?: string) => role === "SCHOOL_ADMIN" || role === "SUPER_ADMIN";

/** Loads the signed-in user once per page; redirects to /login when the session has ended. */
export function useSession() {
  const [user, setUser] = useState<ClientUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me")
      .then(async (response) => {
        if (response.status === 401) {
          location.href = "/login";
          return;
        }
        const data = await response.json();
        if (active) setUser(data.user);
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return { user, loading };
}
