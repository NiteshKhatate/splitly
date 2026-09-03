import Image from "next/image";
import Link from "next/link";
import { CaretDownIcon, ListIcon, SignOutIcon } from "@phosphor-icons/react/ssr";

type DashboardHeaderProps = {
  userName: string;
  avatarUrl?: string | null;
};

/** Links the Splitly wordmark back to the dashboard home. */
function DashboardBrandLink() {
  return (
    <Link href="/dashboard" className="flex items-center gap-3 rounded-control text-card-heading focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
      <span className="flex size-9 items-center justify-center rounded-control bg-primary text-label text-white" aria-hidden="true">S</span>
      <span>Splitly</span>
    </Link>
  );
}

/** Displays the user's profile image or a generated initial fallback. */
function UserAvatar({ name, src }: { name: string; src?: string | null }) {
  const initial = name.trim().charAt(0).toUpperCase() || "S";
  return src ? (
    <Image className="size-9 rounded-full object-cover" src={src} alt="" width={36} height={36} unoptimized />
  ) : (
    <span className="flex size-9 items-center justify-center rounded-full bg-primary-subtle text-label text-primary" aria-hidden="true">{initial}</span>
  );
}

/** Submits the server-handled logout request. */
function LogoutForm() {
  return (
    <form action="/auth/logout" method="post">
      <button type="submit" className="flex min-h-11 w-full items-center gap-2 rounded-control px-3 text-left text-label text-danger hover:bg-danger-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
        <SignOutIcon size={18} weight="bold" aria-hidden="true" />
        Log out
      </button>
    </form>
  );
}

export function DashboardHeader({ userName, avatarUrl }: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-surface">
      <nav className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8" aria-label="Primary navigation">
        <DashboardBrandLink />
        <div className="hidden items-center gap-2 md:flex">
          <Link href="/dashboard" aria-current="page" className="rounded-control bg-primary-subtle px-4 py-2 text-label text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Dashboard</Link>
          <Link href="/groups" className="rounded-control px-4 py-2 text-label text-foreground-muted hover:bg-surface-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Groups</Link>
        </div>
        <details className="group relative hidden md:block">
          <summary className="flex min-h-11 cursor-pointer list-none items-center gap-3 rounded-control px-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
            <UserAvatar name={userName} src={avatarUrl} />
            <span className="max-w-36 truncate text-label">{userName}</span>
            <CaretDownIcon className="text-foreground-muted transition-transform group-open:rotate-180" size={16} weight="bold" aria-hidden="true" />
          </summary>
          <div className="absolute right-0 mt-2 w-44 rounded-card border border-border bg-surface p-2 shadow-sm"><LogoutForm /></div>
        </details>
        <details className="group relative md:hidden">
          <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-control px-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
            <UserAvatar name={userName} src={avatarUrl} />
            <span className="sr-only">Open navigation menu</span>
            <ListIcon className="text-foreground" size={24} weight="bold" aria-hidden="true" />
          </summary>
          <div className="absolute right-0 mt-2 w-56 rounded-card border border-border bg-surface p-2 shadow-sm">
            <p className="truncate px-3 py-2 text-label">{userName}</p>
            <Link href="/dashboard" aria-current="page" className="block min-h-11 rounded-control bg-primary-subtle px-3 py-3 text-label text-primary">Dashboard</Link>
            <Link href="/groups" className="block min-h-11 rounded-control px-3 py-3 text-label text-foreground-muted hover:bg-surface-muted">Groups</Link>
            <div className="mt-1 border-t border-border pt-1"><LogoutForm /></div>
          </div>
        </details>
      </nav>
    </header>
  );
}
