import { forwardRef, type ComponentProps } from "react";

type SelectFieldProps = ComponentProps<"select"> & {
  error?: string;
  label: string;
};

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(function SelectField(
  { children, className, error, id, label, ...props },
  ref,
) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-label text-foreground">{label}</label>
      <select
        ref={ref}
        id={id}
        aria-describedby={error ? `${id}-error` : undefined}
        aria-invalid={error ? "true" : undefined}
        className={[
          "min-h-12 w-full rounded-control border bg-surface px-3 py-2 text-body text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary-subtle",
          error ? "border-danger" : "border-border",
          className,
        ].filter(Boolean).join(" ")}
        {...props}
      >
        {children}
      </select>
      {error ? <p id={`${id}-error`} className="mt-2 text-caption text-danger">{error}</p> : null}
    </div>
  );
});
