import type { NextConfig } from "next";

/**
 * Sicherheits-Kopfzeilen für jede Antwort, nach `docs/production/security-headers.md`.
 *
 * Eine Content-Security-Policy ist bewusst **nicht** dabei: Sie ist die
 * wirksamste dieser Kopfzeilen, bricht aber eine App, sobald eine Quelle
 * fehlt. Sie gehört in einen eigenen Durchgang mit eigener Prüfung.
 */
const securityHeaders = [
  // Kein Einbetten in fremde Seiten (Clickjacking).
  { key: "X-Frame-Options", value: "DENY" },
  // Keine geratenen Inhaltstypen (MIME-Sniffing).
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Fremde Seiten sehen die Herkunft, nicht den vollen Pfad.
  { key: "Referrer-Policy", value: "origin-when-cross-origin" },
  // Erzwingt HTTPS für ein Jahr, auch auf Subdomains.
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
