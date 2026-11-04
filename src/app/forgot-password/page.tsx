"use client";
import { FormEvent, useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/auth/forgot-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Something went wrong. Please try again.");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#f4f8fb] px-4 py-10">
      <form onSubmit={submit} className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8">
        <h1 className="text-2xl font-extrabold">Reset your password</h1>
        {done ? (
          <p className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">If that email belongs to an account, a reset link is on its way. It works once and expires in 1 hour.</p>
        ) : (
          <>
            <p className="mt-1 text-sm text-slate-500">Enter your account email and we will send you a reset link.</p>
            <label className="mt-6 block text-xs font-bold">Email address
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#2583c5]" />
            </label>
            {error && <p role="alert" className="mt-4 rounded-lg bg-rose-50 p-3 text-xs text-rose-700">{error}</p>}
            <button disabled={busy} className="mt-6 w-full rounded-xl bg-[#176ba8] px-4 py-3 text-sm font-bold text-white disabled:opacity-60">{busy ? "Sending…" : "Send reset link"}</button>
          </>
        )}
        <p className="mt-5 text-center text-xs text-slate-500"><Link href="/login" className="font-bold text-[#176ba8]">Back to sign in</Link></p>
      </form>
    </main>
  );
}
