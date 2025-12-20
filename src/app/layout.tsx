import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import QueryProvider from "./provider";
import { RealtimeProvider } from "@/components/providers/RealtimeProvider";
import { CryptoProvider } from "@/lib/crypto-context";
import { AppErrorBoundary } from "@/components/ErrorBoundary";
import GlobalCallIndicator from "@/components/GlobalCallIndicator";
import IncomingCall from "@/components/IncomingCall";
import { Toaster } from "@/components/ui/Toaster";
import CallOverlay from "@/components/calls/CallOverlay";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ChatFusion",
  description: "Premium E2E Encrypted Chat Application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}>
        <AppErrorBoundary>
          <QueryProvider>
            <RealtimeProvider>
              <CryptoProvider>
                {children}
                <Toaster />
                <GlobalCallIndicator />
                <CallOverlay />

              </CryptoProvider>
            </RealtimeProvider>
          </QueryProvider>
        </AppErrorBoundary>
      </body>
    </html>
  );
}
