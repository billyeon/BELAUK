"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

const items = [
  { href: "/", key: "home", icon: "◎" },
  { href: "/products", key: "browse", icon: "⌕" },
  { href: "/scan", key: "sell", icon: "＋" },
  { href: "/profile", key: "profile", icon: "☺" },
] as const;

export function BottomNav() {
  const t = useTranslations("nav");
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-[480px] border-t border-line bg-surface"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <ul className="grid grid-cols-4">
        {items.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <li key={item.key}>
              <Link
                href={item.href}
                className={`flex flex-col items-center gap-0.5 py-2.5 text-[11px] ${
                  active ? "text-accent-dark font-semibold" : "text-muted"
                }`}
              >
                <span className="text-lg leading-none">{item.icon}</span>
                {t(item.key)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
