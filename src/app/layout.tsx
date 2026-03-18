import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

import { Geist_Mono } from "next/font/google";
const font = Geist_Mono({ subsets: ["latin"] });

//const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Collaborative Task Manager",
  description: "Real-time collaborative task management",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={font.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}