"use client";
import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";

type School = { name: string; phone: string | null; address: string | null; paystackSubaccountCode: string | null; termsAcceptedAt: string | null; termsVersion: string | null };

const field = "mt-2 w-full rounded-lg border border-slate-200 p-3 text-sm";

export function SchoolSection() {
  const [school, setSchool] = useState<School | null>(null);
  const [platformAllowed, setPlatformAllowed] = useState(false);
  const [code, setCode] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    fetch("/api/school")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!data) return;
        setSchool(data.school);
        setCode(data.school?.paystackSubaccountCode || "");
        setPlatformAllowed(Boolean(data.platformPaymentsAllowed));
      })
      .catch(() => undefined);
  }, []);

  async function save(event: FormEvent) {
    event.preventDefault();
    setNotice("");
    const response = await fetch("/api/school", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ paystackSubaccountCode: code.trim() }) });
    const data = await response.json().catch(() => ({}));
    setNotice(response.ok ? "Payment settlement account saved." : data.error || "Could not save.");
  }

  if (!school) return null;
  return (
    <div className="mt-5 grid gap-5 md:grid-cols-2">
      <form onSubmit={save} className="rounded-2xl border bg-white p-5">
        <h2 className="font-extrabold">Fee payments (Paystack)</h2>
        <p className="mt-1 text-xs text-slate-400">
          Each school is paid into its own Paystack subaccount. Create one in your Paystack dashboard (Subaccounts) and paste its code here.
          {platformAllowed ? " Payments without a subaccount are currently allowed and settle to the platform account." : " Online payments stay switched off until a subaccount is added."}
        </p>
        <label className="mt-4 block text-xs font-bold">Subaccount code
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="ACCT_xxxxxxxxxx" className={field} />
        </label>
        {notice && <p role="status" className="mt-3 text-xs font-semibold text-[#176ba8]">{notice}</p>}
        <button className="mt-4 rounded-lg bg-[#176ba8] px-4 py-2.5 text-xs font-bold text-white">Save</button>
      </form>
      <section className="rounded-2xl border bg-white p-5">
        <h2 className="font-extrabold">Your data and legal</h2>
        <p className="mt-1 text-xs text-slate-400">Download everything your school has stored, or review the terms you agreed to.</p>
        <a href="/api/export" className="mt-4 inline-block rounded-lg border px-4 py-2.5 text-xs font-bold text-[#176ba8]">Download all school data (JSON)</a>
        <p className="mt-4 text-xs text-slate-500">
          Terms accepted{school.termsAcceptedAt ? ` on ${new Date(school.termsAcceptedAt).toLocaleDateString()}` : ""}{school.termsVersion ? ` (version ${school.termsVersion})` : ""}.
        </p>
        <p className="mt-2 text-xs"><Link href="/terms" className="font-bold text-[#176ba8]">Terms of Service</Link> · <Link href="/privacy" className="font-bold text-[#176ba8]">Privacy Policy</Link></p>
        <p className="mt-3 text-xs text-slate-400">To erase a student&apos;s personal details, use &quot;Erase data&quot; on the Students page.</p>
      </section>
    </div>
  );
}
