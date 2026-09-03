import Link from "next/link";
import { Card } from "@/components/ui/card";
import { getSafeRedirectPath } from "@/lib/auth/redirects";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string; message?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-8 sm:px-6 sm:py-16 lg:px-8">
      <section className="w-full max-w-md" aria-labelledby="login-heading">
        <Link
          href="/"
          className="mx-auto mb-8 flex w-fit items-center gap-3 text-card-heading focus-visible:rounded-control focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <span className="flex size-10 items-center justify-center rounded-control bg-primary text-label text-white">
            S
          </span>
          <span>Splitly</span>
        </Link>
        <Card>
          <div className="mb-6 text-center sm:mb-8">
            <h1 id="login-heading" className="text-page-heading">
              Log in to Splitly
            </h1>
            <p className="mt-3 text-secondary text-foreground-muted">
              See your groups and settle shared expenses.
            </p>
          </div>
          <LoginForm
            redirectTo={getSafeRedirectPath(params.redirectTo)}
            initialMessage={params.message}
          />
        </Card>
      </section>
    </main>
  );
}
