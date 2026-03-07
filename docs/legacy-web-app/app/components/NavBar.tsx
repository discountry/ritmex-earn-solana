"use client";

import { File, Globe } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useLocale, type Locale } from "@/i18n/LocaleProvider";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";

const BaseWalletMultiButtonDynamic = dynamic(
  async () =>
    (await import("@solana/wallet-adapter-react-ui")).BaseWalletMultiButton,
  { ssr: false }
);

export default function NavBar() {
  const { locale, setLocale, t } = useLocale();

  const LABELS = {
    "change-wallet": t.wallet.changeWallet,
    connecting: t.wallet.connecting,
    "copy-address": t.wallet.copyAddress,
    copied: t.wallet.copied,
    disconnect: t.wallet.disconnect,
    "has-wallet": t.wallet.connectWallet,
    "no-wallet": t.wallet.connectWallet,
  } as const;

  return (
    <nav className="w-full">
      <div className="w-full xl:max-w-7xl mx-auto px-4 pt-4 pb-4">
        <div className="flex items-center justify-between w-full">
          <div className="flex-1 min-w-0 flex items-center justify-start space-x-4">
            <Link href="/">
              <p className="text-2xl text-white font-bold">RitMEX</p>
            </Link>
            <Link
              href="https://docs.ritmex.one/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <p className="flex justify-center items-center space-x-1 text-gray-300">
                <File size={16} />
                <span className="hidden sm:inline">{t.nav.help}</span>
              </p>
            </Link>
          </div>
          <div className="flex items-center space-x-3 shrink-0">
            <Menu>
              <MenuButton
                aria-label={t.language[locale]}
                className="flex items-center gap-0 sm:gap-1 rounded-full px-2.5 sm:px-3 py-1.5 text-sm text-gray-300 hover:text-white border border-gray-600 hover:border-gray-400 transition-colors"
              >
                <Globe size={16} />
                <span className="hidden sm:inline">{t.language[locale]}</span>
              </MenuButton>
              <MenuItems
                transition
                anchor="bottom end"
                className="w-32 origin-top-right rounded-xl border border-white/5 bg-gray-900 p-1 text-sm/6 text-white transition duration-100 ease-out [--anchor-gap:var(--spacing-1)] focus:outline-none data-[closed]:scale-95 data-[closed]:opacity-0 z-50"
              >
                <MenuItem>
                  <button
                    onClick={() => setLocale("zh" as Locale)}
                    className={`group flex w-full items-center gap-2 rounded-lg py-1.5 px-3 data-[focus]:bg-white/10 ${
                      locale === "zh" ? "text-blue-400" : ""
                    }`}
                  >
                    中文
                  </button>
                </MenuItem>
                <MenuItem>
                  <button
                    onClick={() => setLocale("en" as Locale)}
                    className={`group flex w-full items-center gap-2 rounded-lg py-1.5 px-3 data-[focus]:bg-white/10 ${
                      locale === "en" ? "text-blue-400" : ""
                    }`}
                  >
                    English
                  </button>
                </MenuItem>
              </MenuItems>
            </Menu>
            <BaseWalletMultiButtonDynamic
              style={{
                borderRadius: "25rem",
                height: "2.5rem",
                backgroundColor: "transparent",
                border: "1px solid #4B5563",
                minWidth: "max-content",
                whiteSpace: "nowrap",
                padding: "0 0.875rem",
                fontSize: "0.875rem",
              }}
              labels={LABELS}
            />
          </div>
        </div>
      </div>
    </nav>
  );
}
