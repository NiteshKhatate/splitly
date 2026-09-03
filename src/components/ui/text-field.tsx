import type { ComponentProps, ReactNode } from "react";

type TextFieldProps = ComponentProps<"input"> & {
  label: string;
  error?: string;
  helperText?: string;
  action?: ReactNode;
};

export function TextField({
  action,
  className,
  error,
  helperText,
  id,
  label,
  ...props
}: TextFieldProps) {
  const describedBy = [
    error ? `${id}-error` : undefined,
    helperText ? `${id}-helper` : undefined,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4">
        <label htmlFor={id} className="text-label text-foreground">
          {label}
        </label>
        {action}
      </div>
      <input
        id={id}
        aria-describedby={describedBy || undefined}
        aria-invalid={error ? "true" : undefined}
        className={[
          "min-h-12 w-full max-w-full rounded-control border bg-surface px-3 py-2 text-body text-foreground outline-none transition-colors placeholder:text-foreground-muted focus:border-primary focus:ring-2 focus:ring-primary-subtle",
          error ? "border-danger" : "border-border",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...props}
      />
      {helperText ? (
        <p id={`${id}-helper`} className="mt-2 text-caption text-foreground-muted">
          {helperText}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="mt-2 text-caption text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
