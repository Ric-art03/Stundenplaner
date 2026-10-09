import type { Metadata } from "next";
// Die Anzeige zu `useToast` — über sie melden alle Seiten der App. Eingebunden
// war hier lange die Anzeige der anderen Bibliothek (`ui/sonner`), die niemand
// benutzt: jede Meldung wurde erzeugt und nie gezeigt (BUG-17).
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

export const metadata: Metadata = {
  title: "Stundenplaner",
  description: "Sporteinheiten planen — einfach, strukturiert, abwechslungsreich.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className="antialiased min-h-screen bg-background">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
