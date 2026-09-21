import Image from "next/image";
import Link from "next/link";
import {
  ClockCounterClockwiseIcon,
  HouseIcon,
  PlusIcon,
  SignOutIcon,
  UserCircleIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react/ssr";

type DashboardHeaderProps = {
  userName: string;
  avatarUrl?: string | null;
  activePath?: "/activity" | "/dashboard" | "/expenses/new" | "/groups" | "/settings";
};

type NavigationItem = {
  href: NonNullable<DashboardHeaderProps["activePath"]>;
  icon: typeof HouseIcon;
  label: string;
};

const navigationItems: NavigationItem[] = [
  { href: "/dashboard", icon: HouseIcon, label: "Home" },
  { href: "/activity", icon: ClockCounterClockwiseIcon, label: "Activity" },
  { href: "/groups", icon: UsersThreeIcon, label: "Groups" },
  { href: "/settings", icon: UserCircleIcon, label: "Account" },
];

function BrandLink() {
  return (
    <Link
      href="/dashboard"
      className="flex min-h-11 items-center gap-3 rounded-control text-card-heading focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <span className="flex size-9 items-center justify-center rounded-control bg-primary text-label text-white" aria-hidden="true">S</span>
      <span>Splitly</span>
    </Link>
  );
}

function UserAvatar({ name, src }: { name: string; src?: string | null }) {
  const initial = name.trim().charAt(0).toUpperCase() || "S";

  return src ? (
    <Image className="size-9 rounded-full object-cover" src={src} alt="" width={36} height={36} unoptimized />
  ) : (
    <span className="flex size-9 items-center justify-center rounded-full bg-primary-subtle text-label text-primary" aria-hidden="true">{initial}</span>
  );
}

function LogoutForm() {
  return (
    <form action="/auth/logout" method="post">
      <button type="submit" className="flex min-h-11 w-full items-center gap-3 rounded-control px-3 text-left text-label text-danger hover:bg-danger-subtle">
        <SignOutIcon size={20} weight="bold" aria-hidden="true" />
        Log out
      </button>
    </form>
  );
}

function DesktopNavigationLink({ activePath, item }: { activePath: DashboardHeaderProps["activePath"]; item: NavigationItem }) {
  const Icon = item.icon;
  const isActive = activePath === item.href;

  return (
    <Link
      href={item.href}
      aria-current={isActive ? "page" : undefined}
      className={`flex min-h-12 items-center gap-3 rounded-control px-3 text-label transition-colors ${isActive ? "bg-primary-subtle text-primary" : "text-foreground-muted hover:bg-surface-muted hover:text-foreground"}`}
    >
      <Icon size={22} weight={isActive ? "fill" : "regular"} aria-hidden="true" />
      {item.label}
    </Link>
  );
}

function MobileNavigationLink({ activePath, item }: { activePath: DashboardHeaderProps["activePath"]; item: NavigationItem }) {
  const Icon = item.icon;
  const isActive = activePath === item.href;

  return (
    <Link
      href={item.href}
      aria-current={isActive ? "page" : undefined}
      className={`flex min-h-16 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-control px-1 text-caption ${isActive ? "text-primary" : "text-foreground-muted"}`}
    >
      <Icon size={22} weight={isActive ? "fill" : "regular"} aria-hidden="true" />
      <span>{item.label}</span>
    </Link>
  );
}

export function DashboardHeader({ userName, avatarUrl, activePath = "/dashboard" }: DashboardHeaderProps) {
  const [homeItem, activityItem, groupsItem, accountItem] = navigationItems;
  const isAddActive = activePath === "/expenses/new";

  return (
    <>
      <header className="sticky top-0 z-30 flex min-h-14 items-center justify-between border-b border-border bg-surface/95 px-4 backdrop-blur md:hidden">
        <BrandLink />
        <Link
          href="/settings"
          aria-label={`Open account for ${userName}`}
          className="flex min-h-11 min-w-11 items-center justify-center rounded-full"
        >
          <UserAvatar name={userName} src={avatarUrl} />
        </Link>
      </header>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-surface px-4 py-5 md:flex">
        <div className="px-2"><BrandLink /></div>
        <Link
          href="/expenses/new"
          aria-current={isAddActive ? "page" : undefined}
          className="mt-7 flex min-h-12 items-center justify-center gap-2 rounded-control bg-primary px-4 text-label text-white hover:bg-primary-hover"
        >
          <PlusIcon size={20} weight="bold" aria-hidden="true" />
          Add expense
        </Link>
        <nav aria-label="Desktop navigation" className="mt-5 flex flex-col gap-1">
          {navigationItems.map((item) => <DesktopNavigationLink activePath={activePath} item={item} key={item.href} />)}
        </nav>
        <div className="mt-auto border-t border-border pt-4">
          <div className="flex items-center gap-3 px-3 py-2">
            <UserAvatar name={userName} src={avatarUrl} />
            <span className="min-w-0 flex-1 truncate text-label">{userName}</span>
          </div>
          <LogoutForm />
        </div>
      </aside>

      <nav
        aria-label="Mobile navigation"
        className="safe-area-bottom fixed inset-x-0 bottom-0 z-30 flex items-end border-t border-border bg-surface/95 px-1 shadow-[0_-1px_3px_rgba(15,23,42,0.08)] backdrop-blur md:hidden"
      >
        <MobileNavigationLink activePath={activePath} item={homeItem} />
        <MobileNavigationLink activePath={activePath} item={activityItem} />
        <Link
          href="/expenses/new"
          aria-current={isAddActive ? "page" : undefined}
          aria-label="Add expense"
          className="flex min-h-16 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-control px-1 text-caption text-primary"
        >
          <span className="-mt-5 flex size-12 items-center justify-center rounded-full border-4 border-background bg-primary text-white shadow-sm" aria-hidden="true">
            <PlusIcon size={24} weight="bold" />
          </span>
          <span>Add</span>
        </Link>
        <MobileNavigationLink activePath={activePath} item={groupsItem} />
        <MobileNavigationLink activePath={activePath} item={accountItem} />
      </nav>
    </>
  );
}
