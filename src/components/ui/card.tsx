import type { ComponentProps } from "react";

type CardProps = ComponentProps<"div">;

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={[
        "rounded-card border border-border bg-surface p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-6",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}
