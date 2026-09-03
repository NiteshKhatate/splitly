import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const steps = [
  {
    number: "1",
    title: "Create a group",
    description:
      "Create a group for your trip, roommates, friends, family, or any shared expenses.",
  },
  {
    number: "2",
    title: "Add expenses",
    description: "Record who paid and how the expense should be split.",
  },
  {
    number: "3",
    title: "Settle up",
    description: "See who owes whom and record settlements.",
  },
];

export default async function Home() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const sessionAction = user ? (
    <Button href="/dashboard" variant="secondary">
      Dashboard
    </Button>
  ) : (
    <Button href="/login" variant="secondary">
      Login
    </Button>
  );

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-surface">
        <nav
          aria-label="Primary navigation"
          className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-4 sm:gap-4 sm:px-6 lg:px-8"
        >
          <Link
            href="/"
            aria-label="Splitly home"
            className="inline-flex items-center gap-3 text-card-heading focus-visible:rounded-control focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <span
              className="flex size-10 items-center justify-center rounded-control bg-primary text-label text-white"
              aria-hidden="true"
            >
              S
            </span>
            <span className="hidden sm:inline">Splitly</span>
          </Link>

          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            {sessionAction}
            {!user ? <Button href="/signup">Get Started</Button> : null}
          </div>
        </nav>
      </header>

      <section className="border-b border-border">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 sm:py-20 lg:grid-cols-[minmax(0,1fr)_minmax(320px,448px)] lg:items-center lg:gap-12 lg:px-8 lg:py-24">
          <div className="max-w-2xl">
            <p className="mb-4 text-label text-primary">Shared expenses, settled clearly</p>
            <h1 className="text-page-heading">
              Split expenses. Keep friendships simple.
            </h1>
            <p className="mt-6 max-w-xl text-body text-foreground-muted">
              Track shared expenses and know exactly who owes whom.
            </p>

            <div className={`mt-8 grid gap-3 sm:inline-grid ${user ? "sm:grid-cols-1" : "sm:grid-cols-2"}`}>
              {!user ? <Button href="/signup">Get Started</Button> : null}
              {sessionAction}
            </div>
          </div>

          <Card className="bg-surface">
            <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-label text-foreground-muted">Goa trip</p>
                <p className="mt-2 text-large-amount">₹18,420</p>
              </div>
              <span className="w-fit rounded-control bg-primary-subtle px-3 py-1 text-caption text-primary">
                Active
              </span>
            </div>

            <div className="space-y-4 py-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <div className="min-w-0">
                  <p className="text-label">You are owed</p>
                  <p className="text-secondary text-foreground-muted">Rahul and Anika</p>
                </div>
                <p className="text-amount text-success sm:text-right">+₹2,150</p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <div className="min-w-0">
                  <p className="text-label">You owe</p>
                  <p className="text-secondary text-foreground-muted">Maya</p>
                </div>
                <p className="text-amount text-danger sm:text-right">-₹740</p>
              </div>
            </div>

            <div className="rounded-card bg-surface-muted p-4">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <p className="text-label">Dinner at Fisherman Wharf</p>
                <p className="text-label sm:text-right">₹4,800</p>
              </div>
              <p className="mt-2 text-secondary text-foreground-muted">
                Paid by you, split equally with 4 people
              </p>
            </div>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="max-w-2xl">
          <h2 className="text-section-heading">How Splitly works</h2>
          <p className="mt-4 text-body text-foreground-muted">
            A simple flow for shared expenses, from the first group to the final settlement.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:gap-6 md:grid-cols-3">
          {steps.map((step) => (
            <Card key={step.number}>
              <div className="mb-6 flex size-10 items-center justify-center rounded-control bg-primary-subtle text-label text-primary">
                {step.number}
              </div>
              <h3 className="text-card-heading">{step.title}</h3>
              <p className="mt-3 text-secondary text-foreground-muted">
                {step.description}
              </p>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
