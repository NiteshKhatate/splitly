export function DashboardWelcome({ userName }: { userName: string }) {
  return (
    <div>
      <h1 className="wrap-break-word text-page-heading">Good morning, {userName} <span aria-hidden="true">👋</span></h1>
      <p className="mt-1.5 text-secondary text-foreground-muted sm:mt-2 sm:text-body">Here&apos;s your expense overview.</p>
    </div>
  );
}
