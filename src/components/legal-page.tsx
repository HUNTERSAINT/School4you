import Link from "next/link";
import { LEGAL, type LegalSection } from "@/lib/legal";

export function LegalPage({ title, sections }: { title: string; sections: LegalSection[] }) {
  return (
    <main className="min-h-screen bg-[#f6f8fb] px-4 py-10">
      <article className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 md:p-10">
        <Link href="/login" className="text-xs font-bold text-[#176ba8]">
          ← Back to School4you
        </Link>
        <h1 className="mt-4 text-3xl font-extrabold">{title}</h1>
        <p className="mt-1 text-xs text-slate-400">Last updated {LEGAL.updated}</p>
        {LEGAL.showDraftBanner && (
          <p className="mt-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">This document is a draft and has not yet been reviewed by a lawyer. It may change.</p>
        )}
        {sections.map((section) => (
          <section key={section.title} className="mt-6">
            <h2 className="font-extrabold">{section.title}</h2>
            {section.body.map((paragraph) => (
              <p key={paragraph} className="mt-2 text-sm leading-6 text-slate-600">
                {paragraph}
              </p>
            ))}
          </section>
        ))}
        <p className="mt-10 border-t pt-4 text-xs text-slate-400">
          <Link href="/terms" className="font-bold text-[#176ba8]">Terms of Service</Link> · <Link href="/privacy" className="font-bold text-[#176ba8]">Privacy Policy</Link>
        </p>
      </article>
    </main>
  );
}
