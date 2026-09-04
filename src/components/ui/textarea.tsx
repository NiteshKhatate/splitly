import { forwardRef, type ComponentProps } from "react";

type TextareaProps = ComponentProps<"textarea"> & {
  label: string;
  error?: string;
  helperText?: string;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea({
  className,
  error,
  helperText,
  id,
  label,
  ...props
}, ref) {
  const describedBy = [
    error ? `${id}-error` : undefined,
    helperText ? `${id}-helper` : undefined,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-label text-foreground">
        {label}
      </label>
      <textarea
        ref={ref}
        id={id}
        aria-describedby={describedBy || undefined}
        aria-invalid={error ? "true" : undefined}
        className={[
          "min-h-28 w-full max-w-full resize-y rounded-control border bg-surface px-3 py-2 text-body text-foreground outline-none transition-colors placeholder:text-foreground-muted focus:border-primary focus:ring-2 focus:ring-primary-subtle",
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
});
