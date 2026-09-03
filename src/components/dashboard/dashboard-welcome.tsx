export function DashboardWelcome({ userName }: { userName: string }) {
  return (
    <div>
      <h1 className="text-section-heading sm:text-page-heading">Good morning, {userName} <span aria-hidden="true">👋</span></h1>
      <p className="mt-2 text-body text-foreground-muted">Here&apos;s your expense overview.</p>
    </div>
  );
}
