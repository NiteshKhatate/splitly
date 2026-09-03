import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";

export function SectionCard({ id, title, action, children }: { id: string; title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <Card className="h-full">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 id={id} className="text-card-heading">{title}</h2>
        {action}
      </div>
      <div aria-labelledby={id}>{children}</div>
    </Card>
  );
}
