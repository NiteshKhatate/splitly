import Image from "next/image";
import Link from "next/link";
import {
  CaretDownIcon,
  ClockCounterClockwiseIcon,
  HouseIcon,
  SignOutIcon,
  UserCircleIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react/ssr";

type DashboardHeaderProps = {
  userName: string;
  avatarUrl?: string | null;
  activePath?: "/activity" | "/dashboard" | "/groups" | "/settings";
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

function getNavLinkClassName(isActive: boolean) {
  return [
    "inline-flex min-h-11 items-center rounded-control px-4 py-2 text-label focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
    isActive
      ? "bg-primary-subtle text-primary"
      : "text-foreground-muted hover:bg-surface-muted hover:text-foreground",
  ].join(" ");
}

function getMobileNavLinkClassName(isActive: boolean) {
  return [
    "flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-control px-1 py-1.5 text-caption focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary",
    isActive
      ? "text-primary"
      : "text-foreground-muted hover:bg-surface-muted hover:text-foreground",
  ].join(" ");
}

export function DashboardHeader({
  userName,
  avatarUrl,
  activePath = "/dashboard",
}: DashboardHeaderProps) {
  const isDashboardActive = activePath === "/dashboard";
  const isGroupsActive = activePath === "/groups";
  const isActivityActive = activePath === "/activity";
  const isSettingsActive = activePath === "/settings";

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-border bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/85">
        <nav className="mx-auto flex min-h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:min-h-16 sm:gap-4 sm:px-6 lg:px-8" aria-label="Primary navigation">
        <DashboardBrandLink />
        <div className="hidden items-center gap-2 md:flex">
          <Link href="/dashboard" aria-current={isDashboardActive ? "page" : undefined} className={getNavLinkClassName(isDashboardActive)}>Dashboard</Link>
          <Link href="/groups" aria-current={isGroupsActive ? "page" : undefined} className={getNavLinkClassName(isGroupsActive)}>Groups</Link>
          <Link href="/activity" aria-current={isActivityActive ? "page" : undefined} className={getNavLinkClassName(isActivityActive)}>Activity</Link>
          <Link href="/settings" aria-current={isSettingsActive ? "page" : undefined} className={getNavLinkClassName(isSettingsActive)}>Profile</Link>
        </div>
        <details className="group relative hidden md:block">
          <summary className="flex min-h-11 min-w-11 cursor-pointer list-none items-center gap-3 rounded-control px-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
            <UserAvatar name={userName} src={avatarUrl} />
            <span className="max-w-36 truncate text-label">{userName}</span>
            <CaretDownIcon className="text-foreground-muted transition-transform group-open:rotate-180" size={16} weight="bold" aria-hidden="true" />
          </summary>
          <div className="absolute right-0 mt-2 w-44 rounded-card border border-border bg-surface p-2 shadow-sm"><LogoutForm /></div>
        </details>
        <details className="group relative md:hidden">
          <summary className="flex min-h-11 min-w-11 cursor-pointer list-none items-center justify-center rounded-control focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
            <UserAvatar name={userName} src={avatarUrl} />
            <span className="sr-only">Open account menu</span>
          </summary>
          <div className="absolute right-0 mt-2 w-56 rounded-card border border-border bg-surface p-2 shadow-lg">
            <p className="truncate px-3 py-2 text-label">{userName}</p>
            <div className="border-t border-border pt-1"><LogoutForm /></div>
          </div>
        </details>
        </nav>
      </header>
      <nav
        aria-label="Mobile navigation"
        className="safe-area-bottom fixed inset-x-0 bottom-0 z-30 flex border-t border-border bg-surface/95 px-2 pb-1 shadow-[0_-1px_3px_rgba(15,23,42,0.04)] backdrop-blur supports-[backdrop-filter]:bg-surface/90 md:hidden"
      >
        <Link href="/dashboard" aria-current={isDashboardActive ? "page" : undefined} className={getMobileNavLinkClassName(isDashboardActive)}>
          <HouseIcon aria-hidden="true" size={21} weight={isDashboardActive ? "fill" : "regular"} />
          <span>Home</span>
        </Link>
        <Link href="/groups" aria-current={isGroupsActive ? "page" : undefined} className={getMobileNavLinkClassName(isGroupsActive)}>
          <UsersThreeIcon aria-hidden="true" size={21} weight={isGroupsActive ? "fill" : "regular"} />
          <span>Groups</span>
        </Link>
        <Link href="/activity" aria-current={isActivityActive ? "page" : undefined} className={getMobileNavLinkClassName(isActivityActive)}>
          <ClockCounterClockwiseIcon aria-hidden="true" size={21} weight={isActivityActive ? "fill" : "regular"} />
          <span>Activity</span>
        </Link>
        <Link href="/settings" aria-current={isSettingsActive ? "page" : undefined} className={getMobileNavLinkClassName(isSettingsActive)}>
          <UserCircleIcon aria-hidden="true" size={21} weight={isSettingsActive ? "fill" : "regular"} />
          <span>Profile</span>
        </Link>
      </nav>
    </>
  );
}
