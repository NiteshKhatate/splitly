import Link from "next/link";

import { Card } from "@/components/ui/card";
import { ResetPasswordForm } from "./reset-password-form";

export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-8 sm:px-6 sm:py-16 lg:px-8">
      <section className="w-full max-w-md" aria-labelledby="reset-password-heading">
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
            <h1 id="reset-password-heading" className="text-page-heading">
              Choose a new password
            </h1>
            <p className="mt-3 text-secondary text-foreground-muted">
              Create a new password for your Splitly account.
            </p>
          </div>

          <ResetPasswordForm />
        </Card>
      </section>
    </main>
  );
}
