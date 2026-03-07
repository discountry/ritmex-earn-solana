import type { Metadata } from "next";
import { Noto_Sans } from "next/font/google";
import "./globals.css";
import AppWalletProvider from "./components/providers/AppWalletProvider";
import { GlobalStoreProvider } from "./components/providers/StoreProvider";
import Footer from "./components/Footer";
import { LocaleProvider } from "@/i18n/LocaleProvider";

const notoSans = Noto_Sans({
  variable: "--font-noto-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RitMEX Earn",
  description: "RitMEX Earning App",
  keywords: ["RitMEX", "Earning", "App", "Solana", "Defi"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${notoSans.variable} antialiased`}>
        <GlobalStoreProvider>
          <LocaleProvider>
            <AppWalletProvider>{children}</AppWalletProvider>
          </LocaleProvider>
        </GlobalStoreProvider>
        <Footer />
      </body>
    </html>
  );
}
