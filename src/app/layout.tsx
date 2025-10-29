import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CallManager } from "@/components/calls/CallManager";
import { CallUI } from "@/components/calls/CallUI";
import QueryProvider from "./provider";
import ClientOnly from "@/components/ClientOnly";
import { CryptoProvider } from "@/lib/crypto-context";



const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ChatFusion",
  description: "A modern chat application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
          <QueryProvider>
            <CryptoProvider>

              {children}
            </CryptoProvider>
          </QueryProvider>

          <ClientOnly>
            <CallManager />
            <CallUI />
          </ClientOnly>
      </body>
    </html>
  );
}
