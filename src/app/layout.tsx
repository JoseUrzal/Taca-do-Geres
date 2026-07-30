import type { Metadata, Viewport } from "next";
import { Oswald, Space_Mono, Inter } from "next/font/google";
import "./globals.css";

const oswald = Oswald({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-oswald",
});
const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
});
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Taça do Gerês",
  description: "O fim de semana é um campeonato.",
};

export const viewport: Viewport = {
  themeColor: "#14181A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-PT" className={`${oswald.variable} ${spaceMono.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
