import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingNewExpense() {
  return <main aria-label="Loading expense form" className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8" role="status"><span className="sr-only">Loading expense form</span><Skeleton className="h-[40rem] w-full" /></main>;
}
