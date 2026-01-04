import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthProvider from "./components/AuthProvider";
import ThemeProvider from "./components/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ULAB Marks Management System",
  description: "Student Marks Management System - University of Liberal Arts Bangladesh",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased transition-colors duration-200`}
      >
        <AuthProvider>
          <ThemeProvider>
            {children}
            <Toaster richColors position="top-right" />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
