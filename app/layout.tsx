import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner"; // 1. Import Sonner Toaster
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PUREI — iPhone Bekas Terkurasi",
  description:
    "Toko HP bekas pre-owned berkualitas. iPhone dan aksesoris dengan garansi resmi. Siap pakai.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white font-sans text-neutral-900">
        {children}
        
        {/* 2. Pasang Toaster di sini dengan tema dark agar pop-up notifikasinya modern */}
        <Toaster richColors position="top-center" theme="dark" />
      </body>
    </html>
  );
}