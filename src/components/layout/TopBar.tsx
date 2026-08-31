import { Link } from "@/i18n/navigation";
import { LocaleSwitcher } from "./LocaleSwitcher";

export function TopBar({ back }: { back?: { href: string; label: string } }) {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-paper/90 px-4 py-3 backdrop-blur">
      {back ? (
        <Link href={back.href} className="text-sm text-muted" aria-label={back.label}>
          ‹ {back.label}
        </Link>
      ) : (
        <Link href="/" className="text-xl font-extrabold tracking-tight">
          BELAUK<span className="ml-1 text-accent">˰</span>
        </Link>
      )}
      <LocaleSwitcher />
    </header>
  );
}
