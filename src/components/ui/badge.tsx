import type { ReactNode } from "react";

type BadgeTone = "neutral" | "success" | "danger";

const toneClasses: Record<BadgeTone, string> = {
  neutral: "bg-surface-muted text-foreground-muted",
  success: "bg-success-subtle text-success",
  danger: "bg-danger-subtle text-danger",
};

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: BadgeTone;
}) {
  return (
    <span className={`inline-flex items-center rounded-control px-2.5 py-1 text-caption ${toneClasses[tone]}`}>
      {children}
    </span>
  );
}
