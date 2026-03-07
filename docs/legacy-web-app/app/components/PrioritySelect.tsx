"use client";

import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { ChevronDownIcon } from "lucide-react";
import { useGlobalStore } from "./providers/StoreProvider";
import { Priority } from "@/store/globalStore";
import { useLocale } from "@/i18n/LocaleProvider";

export default function PrioritySelect() {
  const { priorityLevel, updatePriorityLevel } = useGlobalStore(
    (state) => state
  );
  const { t } = useLocale();

  const selectedName = {
    Low: t.priority.slow,
    Medium: t.priority.normal,
    High: t.priority.fast,
  };

  const handleSelect = (selected: Priority) => {
    updatePriorityLevel(selected);
  };

  return (
    <div className="basis-1/4 text-right">
      <Menu>
        <MenuButton className="inline-flex items-center gap-2 rounded-md bg-gray-700/50 backdrop-blur-lg py-1.5 px-3 text-sm/6 font-semibold text-white shadow shadow-white/10 focus:outline-none data-[hover]:bg-gray-700 data-[open]:bg-gray-700 data-[focus]:outline-1 data-[focus]:outline-white">
          <span className="text-sm/6 text-white">
            {selectedName[priorityLevel]}
          </span>
          <ChevronDownIcon className="size-4 fill-white/60" />
        </MenuButton>

        <MenuItems
          transition
          anchor="bottom end"
          className="w-52 origin-top-right rounded-xl border border-white/5 bg-gray-900 p-1 text-sm/6 text-white transition duration-100 ease-out [--anchor-gap:var(--spacing-1)] focus:outline-none data-[closed]:scale-95 data-[closed]:opacity-0"
        >
          <MenuItem>
            <button
              onClick={() => handleSelect("High")}
              className="group flex w-full items-center gap-2 rounded-lg py-1.5 px-3 data-[focus]:bg-white/10"
            >
              {t.priority.fast}
            </button>
          </MenuItem>
          <MenuItem>
            <button
              onClick={() => handleSelect("Medium")}
              className="group flex w-full items-center gap-2 rounded-lg py-1.5 px-3 data-[focus]:bg-white/10"
            >
              {t.priority.normal}
            </button>
          </MenuItem>
          <MenuItem>
            <button
              onClick={() => handleSelect("Low")}
              className="group flex w-full items-center gap-2 rounded-lg py-1.5 px-3 data-[focus]:bg-white/10"
            >
              {t.priority.slow}
            </button>
          </MenuItem>
        </MenuItems>
      </Menu>
    </div>
  );
}
