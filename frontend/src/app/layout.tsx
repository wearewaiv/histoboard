import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CellBackground } from "@/components/ui/cell-background";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Histoboard - Pathology Foundation Model Benchmarks",
  description:
    "A centralized dashboard for comparing pathology foundation model performance across multiple benchmarks",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <CellBackground />
        <div className="relative flex min-h-screen flex-col z-10">
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
