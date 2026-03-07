"use client";

import {
  Description,
  Dialog,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import Link from "next/link";
import { useLocale } from "@/i18n/LocaleProvider";

interface ConfirmDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  signature: string;
}

export default function ConfirmDialog({
  isOpen,
  setIsOpen,
  signature,
}: ConfirmDialogProps) {
  const { t } = useLocale();

  return (
    <Dialog
      open={isOpen}
      onClose={() => setIsOpen(false)}
      className="relative z-50"
    >
      <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
        <DialogPanel className="max-w-xl space-y-4 bg-gray-900/50 backdrop-blur-md rounded-lg shadow-lg p-12">
          <DialogTitle className="font-bold">{t.confirm.txSubmitted}</DialogTitle>
          <Description className="text-sm text-gray-300">
            {t.confirm.waitConfirmation}
          </Description>
          <Description className="text-sm text-gray-300">
            {t.confirm.retryNotice}
          </Description>
          <p className="text-xs text-gray-300">
            {t.confirm.viewTxDetails}
            <Link
              href={`https://solscan.io/tx/${signature}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 text-xs underline"
            >
              {signature.slice(0, 8) + "..." + signature.slice(-8)}
            </Link>
          </p>
          <button
            className="w-full flex gap-4 border border-gray-500 rounded-lg p-2 justify-center items-center"
            onClick={() => setIsOpen(false)}
          >
            {t.confirm.gotIt}
          </button>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
