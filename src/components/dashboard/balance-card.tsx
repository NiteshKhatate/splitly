import { Card } from "@/components/ui/card";
import type { BalanceTone } from "./types";

const toneClasses: Record<BalanceTone, string> = {
  success: "bg-success-subtle text-success",
  danger: "bg-danger-subtle text-danger",
  neutral: "bg-surface-muted text-foreground",
};

export function BalanceCard({ label, amount, tone, description }: { label: string; amount: string; tone: BalanceTone; description: string }) {
  return (
    <Card className="min-w-0">
      <div className={`mb-4 flex size-10 items-center justify-center rounded-full ${toneClasses[tone]}`} aria-hidden="true">₹</div>
      <p className="text-label text-foreground-muted">{label}</p>
      <p className={`mt-1 text-large-amount ${tone === "neutral" ? "text-foreground" : tone === "success" ? "text-success" : "text-danger"}`}>{amount}</p>
      <p className="mt-2 text-caption text-foreground-muted">{description}</p>
    </Card>
  );
}
