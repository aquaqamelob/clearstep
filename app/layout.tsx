import type { Metadata, Viewport } from "next";

import { ServiceWorkerRegister } from "./components/ServiceWorkerRegister";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "ClearStep — Z paniki w plan w 3 minuty",
    template: "%s · ClearStep",
  },
  description:
    "ClearStep zamienia stres zdrowotny w konkretny plan działania. Anonimowo, bez logowania, w 3 minuty. Nieplanowana ciąża, kryzys psychiczny i więcej.",
  applicationName: "ClearStep",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ClearStep",
  },
  formatDetection: { telephone: false },
  icons: {
    icon: [{ url: "/favicon.png", type: "image/png" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0f1d" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pl" className="h-full antialiased">
      <head>
        {/* Inter via Google Fonts CDN — intentional, not next/font */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col text-foreground font-sans">
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
