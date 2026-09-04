import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingNewExpense() {
  return <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6"><Skeleton className="h-[40rem] w-full" /></main>;
}
