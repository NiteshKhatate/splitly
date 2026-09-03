import type { ComponentProps } from "react";

type CardProps = ComponentProps<"div">;

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={[
        "rounded-card border border-border bg-surface p-4 shadow-sm sm:p-6",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}
