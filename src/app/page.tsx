"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ModuleShell } from "@/components/module-shell";
import { useSession } from "@/lib/use-session";
import { ArrowUpRight, Users, Wallet, CalendarCheck, BookOpen, Settings, GraduationCap } from "lucide-react";

type Fees = { term: string | null; invoices: number; fullyPaid: number; partiallyPaid: number; unpaid: number; collected: number; outstanding: number; invoiced: number };
type Stats = {
  school: { name: string };
  students: { total: number; active: number };
  fees: Fees | null;
  attendance: { marked: number; present: number; absent: number; rate: number };
};

const money = (n: number) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);
const ALL_ACTIONS = [
  { href: "/students", label: "Students", desc: "View and manage student profiles", icon: Users, roles: ["SCHOOL_ADMIN", "SUPER_ADMIN", "TEACHER", "BURSAR"] },
  { href: "/fees", label: "Manage fees", desc: "Create invoices and track payments", icon: Wallet, roles: ["SCHOOL_ADMIN", "SUPER_ADMIN", "BURSAR"] },
  { href: "/results", label: "Enter results", desc: "Record CA and examination scores", icon: BookOpen, roles: ["SCHOOL_ADMIN", "SUPER_ADMIN", "TEACHER"] },
  { href: "/attendance", label: "Take attendance", desc: "Mark today's class register", icon: CalendarCheck, roles: ["SCHOOL_ADMIN", "SUPER_ADMIN", "TEACHER"] },
];

export default function Home() {
  const { user } = useSession();
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch("/api/dashboard");
        if (response.status === 401) {
          location.href = "/login";
          return;
        }
        setStats(await response.json());
      } catch {
        setError("Dashboard information could not be loaded.");
      }
    })();
  }, []);

  const isAdmin = user?.role === "SCHOOL_ADMIN" || user?.role === "SUPER_ADMIN";
  const fees = stats?.fees ?? null;
  const cards = stats
    ? [
        { label: "Registered students", value: stats.students.total.toLocaleString(), sub: `${stats.students.active} active students`, icon: Users },
        ...(fees
          ? [
              { label: "Fees collected", value: money(fees.collected), sub: `${fees.invoices} invoices${fees.term ? ` · ${fees.term}` : ""}`, icon: Wallet },
              { label: "Outstanding fees", value: money(fees.outstanding), sub: `${fees.unpaid} unpaid · ${fees.partiallyPaid} part-paid`, icon: ArrowUpRight },
            ]
          : []),
        { label: "Attendance today", value: `${stats.attendance.rate}%`, sub: `${stats.attendance.present} present · ${stats.attendance.absent} absent`, icon: CalendarCheck },
      ]
    : [];
  const actions = ALL_ACTIONS.filter((action) => (user ? action.roles.includes(user.role) : false));

  return (
    <ModuleShell title="School overview">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">{user ? `Welcome back, ${user.name}.` : "Your school operations at a glance."}</p>
          <p className="mt-1 text-xs text-slate-400">{new Date().toLocaleDateString("en-NG", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
        </div>
        {isAdmin && (
          <Link href="/settings" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-600">
            <Settings size={15} /> Configure school
          </Link>
        )}
      </div>
      {error && <p className="mb-4 rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{error}</p>}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">{card.label}</span>
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#eaf4fb] text-[#176ba8]">
                  <Icon size={19} />
                </span>
              </div>
              <p className="mt-4 text-2xl font-extrabold">{card.value}</p>
              <p className="mt-2 text-[11px] text-slate-400">{card.sub}</p>
            </div>
          );
        })}
      </div>
      {!stats && !error && <div className="mt-5 rounded-2xl border bg-white p-8 text-center text-sm text-slate-400">Loading live school statistics…</div>}
      {stats && (
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          {fees && (
            <section className="rounded-2xl border bg-white p-5">
              <h2 className="font-extrabold">School fees overview</h2>
              <p className="mt-1 text-xs text-slate-400">Verified payments{fees.term ? ` for ${fees.term}` : ""}</p>
              <div className="mt-5 space-y-4">
                {[
                  { label: "Fully paid invoices", count: fees.fullyPaid, color: "bg-emerald-500" },
                  { label: "Part payments", count: fees.partiallyPaid, color: "bg-amber-400" },
                  { label: "Unpaid invoices", count: fees.unpaid, color: "bg-rose-500" },
                ].map((row) => (
                  <div key={row.label}>
                    <div className="mb-2 flex justify-between text-xs">
                      <span className="text-slate-500">{row.label}</span>
                      <b>{row.count}</b>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className={`h-full rounded-full ${row.color}`} style={{ width: `${fees.invoices ? (row.count / fees.invoices) * 100 : 0}%` }} />
                    </div>
                  </div>
                ))}
                <div className="border-t pt-4">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Total invoiced</span>
                    <b>{money(fees.invoiced)}</b>
                  </div>
                  <div className="mt-2 flex justify-between text-xs">
                    <span className="text-slate-500">Outstanding</span>
                    <b className="text-rose-600">{money(fees.outstanding)}</b>
                  </div>
                </div>
              </div>
              <Link href="/fees" className="mt-4 inline-flex text-xs font-bold text-[#176ba8]">
                Manage school fees →
              </Link>
            </section>
          )}
          <section className="rounded-2xl border bg-white p-5">
            <h2 className="font-extrabold">Quick actions</h2>
            <p className="mt-1 text-xs text-slate-400">Go directly to the tasks you handle every day.</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {actions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link key={action.href} href={action.href} className="rounded-xl border border-slate-100 p-4 transition hover:border-[#b8d8ed] hover:bg-[#f7fbfe]">
                    <Icon size={19} className="text-[#2583c5]" />
                    <p className="mt-3 text-sm font-bold">{action.label}</p>
                    <p className="mt-1 text-[11px] text-slate-400">{action.desc}</p>
                  </Link>
                );
              })}
            </div>
          </section>
        </div>
      )}
      <div className="mt-6 flex items-center gap-3 rounded-2xl bg-[#eaf4fb] p-4">
        <GraduationCap className="shrink-0 text-[#176ba8]" />
        <p className="text-xs leading-5 text-slate-600">
          School4you brings student records, fee collection, academic results and attendance into one workspace. <b>Keep your school data accurate and up to date.</b>
        </p>
      </div>
    </ModuleShell>
  );
}
