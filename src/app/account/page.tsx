"use client";
import { FormEvent, useState } from "react";
import { ModuleShell } from "@/components/module-shell";
import { useSession } from "@/lib/use-session";

export default function AccountPage() {
  const { user } = useSession();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    if (newPassword !== confirm) {
      setMessage({ text: "The new passwords do not match.", ok: false });
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not change your password.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirm("");
      setMessage({ text: "Password changed. You have been signed out of your other devices.", ok: true });
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : "Could not change your password.", ok: false });
    } finally {
      setBusy(false);
    }
  }

  const input = "mt-2 w-full rounded-lg border border-slate-200 p-3 text-sm";
  return (
    <ModuleShell title="My account">
      <div className="grid gap-5 md:grid-cols-2">
        <section className="rounded-2xl border bg-white p-5">
          <h2 className="font-extrabold">Profile</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div><dt className="text-xs text-slate-400">Name</dt><dd className="font-semibold">{user?.name ?? "—"}</dd></div>
            <div><dt className="text-xs text-slate-400">Email</dt><dd className="font-semibold">{user?.email ?? "—"}</dd></div>
            <div><dt className="text-xs text-slate-400">Role</dt><dd className="font-semibold">{user?.role.replace("_", " ") ?? "—"}</dd></div>
          </dl>
        </section>
        <form onSubmit={submit} className="rounded-2xl border bg-white p-5">
          <h2 className="font-extrabold">Change password</h2>
          <label className="mt-4 block text-xs font-bold">Current password
            <input required type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className={input} autoComplete="current-password" />
          </label>
          <label className="mt-4 block text-xs font-bold">New password (10–72 characters)
            <input required type="password" minLength={10} maxLength={72} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={input} autoComplete="new-password" />
          </label>
          <label className="mt-4 block text-xs font-bold">Confirm new password
            <input required type="password" minLength={10} maxLength={72} value={confirm} onChange={(e) => setConfirm(e.target.value)} className={input} autoComplete="new-password" />
          </label>
          {message && <p role="alert" className={`mt-4 rounded-lg p-3 text-xs ${message.ok ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>{message.text}</p>}
          <button disabled={busy} className="mt-5 w-full rounded-xl bg-[#176ba8] p-3 text-sm font-bold text-white disabled:opacity-60">{busy ? "Saving…" : "Change password"}</button>
        </form>
      </div>
    </ModuleShell>
  );
}
