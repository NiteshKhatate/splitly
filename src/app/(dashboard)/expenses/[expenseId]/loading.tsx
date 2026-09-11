import { Skeleton } from "@/components/ui/skeleton";
export default function ExpenseLoading() {
  return <main aria-label="Loading expense" className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8" role="status"><span className="sr-only">Loading expense</span><Skeleton className="h-[32rem] w-full" /></main>;
}
