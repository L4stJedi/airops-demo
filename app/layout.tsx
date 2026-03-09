import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppProvider } from "@/lib/context";
import PwaRegistrar from "@/components/PwaRegistrar";

export const metadata: Metadata = {
  title: "AirOps Suite",
  description: "Aviation Operations Management — Silesia Air & Airstream Jets",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AirOps",
  },
};

export const viewport: Viewport = {
  themeColor: "#070e1d",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body>
        <AppProvider>
          <PwaRegistrar />
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
