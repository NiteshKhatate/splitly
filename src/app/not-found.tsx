import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="max-w-md rounded-card border border-border bg-surface p-6 text-center shadow-sm">
        <p className="text-label text-primary">404</p>
        <h1 className="mt-2 text-page-heading">Page not found</h1>
        <p className="mt-3 text-secondary text-foreground-muted">The page may have moved or you may not have access to it.</p>
        <Button className="mt-6" href="/dashboard">Back to dashboard</Button>
      </div>
    </main>
  );
}
