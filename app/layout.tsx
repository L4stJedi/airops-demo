import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/lib/context";

export const metadata: Metadata = {
  title: "AirOps Suite",
  description: "Aviation Operations Management",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs">
      <body>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
