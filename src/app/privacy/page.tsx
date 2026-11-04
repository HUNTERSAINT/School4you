import { LegalPage } from "@/components/legal-page";
import { PRIVACY } from "@/lib/legal";

export const metadata = { title: "Privacy Policy · School4you" };

export default function PrivacyPage() {
  return <LegalPage title="Privacy Policy" sections={PRIVACY} />;
}
