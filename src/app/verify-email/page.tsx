"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function VerifyEmailPage() {
  const [message, setMessage] = useState("Verifying your email…");
  const [ok, setOk] = useState(false);

  useEffect(() => {
    const token = new URLSearchParams(location.search).get("token");
    if (!token) {
      setMessage("This verification link is not valid.");
      return;
    }
    fetch("/api/auth/verify-email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (response.ok && data.verified) {
          setOk(true);
          setMessage("Your email address is verified. Thank you.");
        } else {
          setMessage(data.error || "This verification link is invalid or has expired.");
        }
      })
      .catch(() => setMessage("We could not verify your email right now. Please try again."));
  }, []);

  return (
    <main className="grid min-h-screen place-items-center bg-[#f4f8fb] px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center">
        <div className={`mx-auto grid h-14 w-14 place-items-center rounded-full text-2xl ${ok ? "bg-emerald-50 text-emerald-600" : "bg-[#eaf4fb] text-[#176ba8]"}`}>{ok ? "✓" : "…"}</div>
        <h1 className="mt-5 text-xl font-extrabold">Email verification</h1>
        <p className="mt-3 text-sm text-slate-500">{message}</p>
        <Link href="/" className="mt-6 inline-block rounded-xl bg-[#176ba8] px-5 py-3 text-xs font-bold text-white">Continue to School4you</Link>
      </div>
    </main>
  );
}
