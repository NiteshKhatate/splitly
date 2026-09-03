import type { ComponentProps } from "react";

type SkeletonProps = ComponentProps<"div">;

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={["animate-pulse rounded-control bg-surface-muted", className]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}
