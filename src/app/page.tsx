"use client";

import { useMemo, useState } from "react";
import {
  Activity, ArrowDownRight, ArrowUpRight, Bell, BookOpen, CalendarCheck,
  ChevronDown, CircleHelp, GraduationCap, LayoutDashboard, Menu, MoreHorizontal,
  Search, Settings, Users, Wallet, X, CheckCircle2, Clock3, AlertCircle
} from "lucide-react";
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
  PieChart, Pie, Cell
} from "recharts";

type Student = { id: number; name: string; className: string; status: "Paid" | "Part payment" | "Unpaid"; amount: number };
const initialStudents: Student[] = [
  { id: 1, name: "Amara Okafor", className: "JSS 2", status: "Paid", amount: 85000 },
  { id: 2, name: "Daniel Ibrahim", className: "SS 1", status: "Part payment", amount: 45000 },
  { id: 3, name: "Zara Adeyemi", className: "Primary 5", status: "Unpaid", amount: 0 },
  { id: 4, name: "Samuel Eze", className: "JSS 3", status: "Paid", amount: 85000 },
  { id: 5, name: "Mariam Bello", className: "SS 2", status: "Unpaid", amount: 0 },
];
const trend = [
  { month: "Jan", fees: 420000 }, { month: "Feb", fees: 510000 }, { month: "Mar", fees: 470000 },
  { month: "Apr", fees: 650000 }, { month: "May", fees: 590000 }, { month: "Jun", fees: 780000 },
  { month: "Jul", fees: 920000 },
];
const money = (n: number) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);

export default function Home() {
  const [students] = useState(initialStudents);
  const [active, setActive] = useState("Overview");
  const [query, setQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const counts = useMemo(() => ({
    paid: students.filter(s => s.status === "Paid").length,
    partial: students.filter(s => s.status === "Part payment").length,
    unpaid: students.filter(s => s.status === "Unpaid").length,
  }), [students]);
  const nav = [
    { label: "Overview", icon: LayoutDashboard }, { label: "Students", icon: Users },
    { label: "School fees", icon: Wallet }, { label: "Results", icon: BookOpen },
    { label: "Attendance", icon: CalendarCheck },
  ];
  const filtered = students.filter(s => s.name.toLowerCase().includes(query.toLowerCase()) || s.className.toLowerCase().includes(query.toLowerCase()));
  const pie = [{ name: "Paid", value: counts.paid, color: "#16a36a" }, { name: "Part payment", value: counts.partial, color: "#f0a22e" }, { name: "Unpaid", value: counts.unpaid, color: "#e35b62" }];

  return <div className="min-h-screen bg-[#f6f8fb] text-[#17283d]">
    <aside className={`fixed inset-y-0 left-0 z-40 flex w-[258px] flex-col border-r border-slate-200 bg-white px-5 py-6 transition-transform lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-[#176ba8] text-white"><GraduationCap size={23}/></div><div><p className="text-lg font-extrabold tracking-tight">School<span className="text-[#2583c5]">4you</span></p><p className="text-[11px] text-slate-400">SCHOOL MANAGEMENT</p></div></div>
        <button className="lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X size={20}/></button>
      </div>
      <div className="mt-10"><p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[.16em] text-slate-400">Workspace</p><nav className="space-y-1">{nav.map(item => { const Icon = item.icon; return <button key={item.label} onClick={() => { setActive(item.label); setMobileOpen(false); }} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition ${active === item.label ? "bg-[#eaf4fb] text-[#176ba8]" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"}`}><Icon size={18}/>{item.label}{item.label === "School fees" && <span className="ml-auto h-2 w-2 rounded-full bg-amber-400"/>}</button>})}</nav></div>
      <div className="mt-auto rounded-2xl bg-[#f1f7fb] p-4"><div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#176ba8]"><CircleHelp size={18}/></div><p className="text-sm font-bold">Need a hand?</p><p className="mt-1 text-xs leading-5 text-slate-500">Your school workspace, all in one place.</p><button className="mt-3 text-xs font-bold text-[#176ba8]">Help centre ↗</button></div>
      <div className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-5"><div className="grid h-9 w-9 place-items-center rounded-full bg-[#dbeeff] text-xs font-bold text-[#176ba8]">SA</div><div className="min-w-0 flex-1"><p className="truncate text-xs font-bold">School Administrator</p><p className="text-[11px] text-slate-400">Administrator</p></div><MoreHorizontal size={18} className="text-slate-400"/></div>
    </aside>
    {mobileOpen && <button aria-label="Close navigation overlay" className="fixed inset-0 z-30 bg-slate-900/30 lg:hidden" onClick={() => setMobileOpen(false)}/>}
    <main className="lg:ml-[258px]">
      <header className="sticky top-0 z-20 flex h-[76px] items-center justify-between border-b border-slate-200/80 bg-white/90 px-5 backdrop-blur md:px-9">
        <div className="flex items-center gap-3"><button className="text-slate-500 lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu/></button><div><p className="text-sm font-bold">Good morning, Administrator</p><p className="hidden text-xs text-slate-400 sm:block">Here’s what’s happening at your school today.</p></div></div>
        <div className="flex items-center gap-3"><button className="relative rounded-xl border border-slate-200 p-2.5 text-slate-500"><Bell size={17}/><span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-rose-500"/></button><div className="hidden items-center gap-2 border-l border-slate-200 pl-4 sm:flex"><div className="grid h-9 w-9 place-items-center rounded-full bg-[#eaf4fb] text-xs font-bold text-[#176ba8]">SC</div><div><p className="text-xs font-bold">My School</p><p className="text-[11px] text-slate-400">Admin account</p></div><ChevronDown size={15} className="text-slate-400"/></div></div>
      </header>
      <div className="mx-auto max-w-[1440px] p-5 md:p-9">
        <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-semibold text-[#2583c5]">TUESDAY, NOVEMBER 3, 2026</p><h1 className="mt-2 text-2xl font-extrabold tracking-tight md:text-[30px]">{active === "Overview" ? "School overview" : active}</h1><p className="mt-1 text-sm text-slate-500">A clear view of your school’s operations.</p></div><div className="flex gap-2"><button className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 shadow-sm">This term <ChevronDown size={14} className="ml-2 inline"/></button><button className="rounded-xl bg-[#176ba8] px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#155889]">＋ Add student</button></div></div>
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Total students", value: "1,248", change: "+8.2%", icon: Users, color: "blue", note: "vs. last term" },
            { label: "Fees collected", value: "₦48.6m", change: "+12.5%", icon: Wallet, color: "green", note: "vs. last term" },
            { label: "Outstanding fees", value: "₦12.4m", change: "25.5%", icon: Activity, color: "amber", note: "of expected fees" },
            { label: "Present today", value: "1,176", change: "94.2%", icon: CalendarCheck, color: "purple", note: "attendance rate" },
          ].map((card) => { const Icon = card.icon; return <div key={card.label} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_3px_16px_rgba(15,42,70,.03)]"><div className="flex items-center justify-between"><span className="text-xs font-semibold text-slate-500">{card.label}</span><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#f1f7fb] text-[#2583c5]"><Icon size={18}/></span></div><p className="mt-4 text-[26px] font-extrabold tracking-tight">{card.value}</p><div className="mt-2 flex items-center gap-1 text-[11px]"><ArrowUpRight size={13} className="text-emerald-600"/><span className="font-bold text-emerald-600">{card.change}</span><span className="text-slate-400">{card.note}</span></div></div>})}
        </section>
        <section className="mt-5 grid gap-5 xl:grid-cols-[1.65fr_1fr]">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_3px_16px_rgba(15,42,70,.03)] md:p-6"><div className="flex items-center justify-between"><div><h2 className="text-sm font-extrabold">Fee collection overview</h2><p className="mt-1 text-xs text-slate-400">School fee payments over the last 7 months</p></div><button className="rounded-lg border border-slate-200 px-3 py-2 text-[11px] font-semibold text-slate-500">2026 <ChevronDown size={13} className="ml-1 inline"/></button></div><div className="mt-6 h-[235px] w-full"><ResponsiveContainer width="100%" height="100%"><AreaChart data={trend} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}><defs><linearGradient id="feeFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2583c5" stopOpacity={0.2}/><stop offset="95%" stopColor="#2583c5" stopOpacity={0}/></linearGradient></defs><CartesianGrid stroke="#edf1f5" vertical={false}/><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }}/><YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 10 }} tickFormatter={v => `₦${v/1000}k`}/><Tooltip formatter={(v) => money(Number(v))}/><Area type="monotone" dataKey="fees" stroke="#2583c5" strokeWidth={2.5} fill="url(#feeFill)"/></AreaChart></ResponsiveContainer></div></div>
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_3px_16px_rgba(15,42,70,.03)] md:p-6"><h2 className="text-sm font-extrabold">School fees status</h2><p className="mt-1 text-xs text-slate-400">Payment distribution · sample records</p><div className="relative mx-auto mt-3 h-[180px] max-w-[240px]"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={pie} dataKey="value" nameKey="name" innerRadius={58} outerRadius={82} paddingAngle={4} stroke="none">{pie.map(p => <Cell key={p.name} fill={p.color}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer><div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><p className="text-2xl font-extrabold">{students.length}</p><p className="text-[10px] text-slate-400">Students</p></div></div><div className="mt-2 space-y-3">{pie.map(p => <div key={p.name} className="flex items-center justify-between text-xs"><span className="flex items-center gap-2 text-slate-500"><span className="h-2.5 w-2.5 rounded-full" style={{background:p.color}}/>{p.name}</span><span className="font-bold">{p.value} <span className="font-normal text-slate-400">({Math.round(p.value/students.length*100)}%)</span></span></div>)}</div></div>
        </section>
        <section className="mt-5 rounded-2xl border border-slate-200/80 bg-white shadow-[0_3px_16px_rgba(15,42,70,.03)]"><div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-5 md:flex-row md:items-center md:px-6"><div><h2 className="text-sm font-extrabold">Recent student fee records</h2><p className="mt-1 text-xs text-slate-400">A quick look at payment status across students</p></div><div className="relative"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search student..." className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-xs outline-none focus:border-[#2583c5] sm:w-[220px]"/></div></div><div className="overflow-x-auto"><table className="w-full min-w-[580px] text-left"><thead className="bg-slate-50/80 text-[10px] uppercase tracking-wider text-slate-400"><tr><th className="px-6 py-3 font-semibold">Student</th><th className="px-4 py-3 font-semibold">Class</th><th className="px-4 py-3 font-semibold">Amount paid</th><th className="px-4 py-3 font-semibold">Payment status</th><th className="px-6 py-3"/></tr></thead><tbody className="divide-y divide-slate-100">{filtered.map(s=><tr key={s.id} className="hover:bg-slate-50/60"><td className="px-6 py-4"><div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-full bg-[#eaf4fb] text-[11px] font-bold text-[#176ba8]">{s.name.split(" ").map(n=>n[0]).join("")}</div><span className="text-xs font-bold">{s.name}</span></div></td><td className="px-4 py-4 text-xs text-slate-500">{s.className}</td><td className="px-4 py-4 text-xs font-semibold">{money(s.amount)}</td><td className="px-4 py-4"><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${s.status==="Paid"?"bg-emerald-50 text-emerald-700":s.status==="Part payment"?"bg-amber-50 text-amber-700":"bg-rose-50 text-rose-700"}`}><span className="h-1.5 w-1.5 rounded-full bg-current"/>{s.status}</span></td><td className="px-6 py-4 text-right"><button className="text-slate-400"><MoreHorizontal size={17}/></button></td></tr>)}</tbody></table>{filtered.length===0&&<p className="p-8 text-center text-xs text-slate-400">No students match your search.</p>}</div><div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 text-[11px] text-slate-400"><span>Showing {filtered.length} sample records</span><button className="font-bold text-[#176ba8]">View all students →</button></div></section>
        <footer className="py-8 text-center text-[11px] text-slate-400">© 2026 School4you · A product by Mazi Saint Concepts</footer>
      </div>
    </main>
  </div>;
}
