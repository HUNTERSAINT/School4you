import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "School4you | School Management",
  description: "A simpler way to manage students, school fees, results and attendance.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
