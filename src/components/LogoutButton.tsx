"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LogoutButton({ demo }: { demo: boolean }) {
  const router = useRouter();

  async function logout() {
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => key.startsWith("japan-2026")).map((key) => caches.delete(key)));
    }
    navigator.serviceWorker?.controller?.postMessage({ type: "CLEAR_CACHES" });
    if (!demo) await createClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={logout}
      className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#ded3c3] bg-white/70 px-4 text-sm font-semibold text-[#514b45] transition hover:border-[#c83b2f] hover:text-[#9f2a22]"
    >
      <LogOut size={16} aria-hidden="true" />
      <span className="hidden sm:inline">Sign out</span>
      <span className="sr-only sm:hidden">Sign out</span>
    </button>
  );
}
