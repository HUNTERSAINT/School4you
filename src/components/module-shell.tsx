"use client";
import Link from "next/link";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { BookOpen, CalendarCheck, GraduationCap, LayoutDashboard, Users, Wallet, Settings } from "lucide-react";
import { useSession } from "@/lib/use-session";

const ADMIN = ["SCHOOL_ADMIN", "SUPER_ADMIN"];
const links = [
  { href: "/", label: "Overview", icon: LayoutDashboard, roles: [...ADMIN, "TEACHER", "BURSAR"] },
  { href: "/students", label: "Students", icon: Users, roles: [...ADMIN, "TEACHER", "BURSAR"] },
  { href: "/fees", label: "School fees", icon: Wallet, roles: [...ADMIN, "BURSAR"] },
  { href: "/results", label: "Results", icon: BookOpen, roles: [...ADMIN, "TEACHER"] },
  { href: "/attendance", label: "Attendance", icon: CalendarCheck, roles: [...ADMIN, "TEACHER"] },
  { href: "/settings", label: "Settings", icon: Settings, roles: ADMIN },
];

export function ModuleShell({ title, children }: { title: string; children: ReactNode }) {
  const pathname = usePathname();
  const { user } = useSession();
  const visible = links.filter((link) => (user ? link.roles.includes(user.role) : link.href === "/"));

  return (
    <div className="min-h-screen bg-[#f6f8fb] text-slate-800">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 md:px-8">
          <Link href="/" className="flex items-center gap-2 font-extrabold">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#176ba8] text-white">
              <GraduationCap size={21} />
            </span>
            School<span className="text-[#2583c5]">4you</span>
          </Link>
          <nav className="flex flex-wrap gap-1">
            {visible.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold ${pathname === link.href ? "bg-[#eaf4fb] text-[#176ba8]" : "text-slate-500 hover:bg-slate-50"}`}
                >
                  <Icon size={15} />
                  <span className="hidden sm:inline">{link.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
            {user && (
              <Link href="/account" className="hover:text-[#176ba8]">
                {user.name}
              </Link>
            )}
            <button
              onClick={async () => {
                await fetch("/api/auth/logout", { method: "POST" });
                location.href = "/login";
              }}
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-widest text-[#2583c5]">{user?.schoolName || "School4you workspace"}</p>
          <h1 className="mt-2 text-2xl font-extrabold">{title}</h1>
        </div>
        {children}
      </main>
      <footer className="py-8 text-center text-xs text-slate-400">School4you · A product by Mazi Saint Concepts</footer>
    </div>
  );
}
