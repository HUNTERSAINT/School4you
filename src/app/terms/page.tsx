import { LegalPage } from "@/components/legal-page";
import { TERMS } from "@/lib/legal";

export const metadata = { title: "Terms of Service · School4you" };

export default function TermsPage() {
  return <LegalPage title="Terms of Service" sections={TERMS} />;
}
