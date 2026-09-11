import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";

export function SectionCard({ id, title, action, children }: { id: string; title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <Card className="h-full">
      <div className="mb-4 flex items-center justify-between gap-3 sm:mb-5 sm:gap-4">
        <h2 id={id} className="text-card-heading">{title}</h2>
        {action}
      </div>
      <div aria-labelledby={id}>{children}</div>
    </Card>
  );
}
