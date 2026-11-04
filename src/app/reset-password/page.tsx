"use client";
import { FormEvent, useState } from "react";
import Link from "next/link";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    const token = new URLSearchParams(location.search).get("token") || "";
    if (password !== confirm) {
      setError("The two passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/auth/reset-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, password }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not reset your password.");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reset your password.");
    } finally {
      setBusy(false);
    }
  }

  const input = "mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#2583c5]";
  return (
    <main className="grid min-h-screen place-items-center bg-[#f4f8fb] px-4 py-10">
      <form onSubmit={submit} className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8">
        <h1 className="text-2xl font-extrabold">Choose a new password</h1>
        {done ? (
          <>
            <p className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">Your password has been changed and other devices were signed out.</p>
            <Link href="/login" className="mt-5 block rounded-xl bg-[#176ba8] px-4 py-3 text-center text-sm font-bold text-white">Sign in</Link>
          </>
        ) : (
          <>
            <label className="mt-6 block text-xs font-bold">New password (10 to 72 characters)
              <input required type="password" minLength={10} maxLength={72} value={password} onChange={(e) => setPassword(e.target.value)} className={input} autoComplete="new-password" />
            </label>
            <label className="mt-4 block text-xs font-bold">Confirm new password
              <input required type="password" minLength={10} maxLength={72} value={confirm} onChange={(e) => setConfirm(e.target.value)} className={input} autoComplete="new-password" />
            </label>
            {error && <p role="alert" className="mt-4 rounded-lg bg-rose-50 p-3 text-xs text-rose-700">{error}</p>}
            <button disabled={busy} className="mt-6 w-full rounded-xl bg-[#176ba8] px-4 py-3 text-sm font-bold text-white disabled:opacity-60">{busy ? "Saving…" : "Change password"}</button>
          </>
        )}
      </form>
    </main>
  );
}
