import { CaretDownIcon } from "@phosphor-icons/react/ssr";
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
      <div className="relative">
        <select
          ref={ref}
          id={id}
          aria-describedby={error ? `${id}-error` : undefined}
          aria-invalid={error ? "true" : undefined}
          className={[
            "min-h-12 w-full appearance-none rounded-control border bg-surface py-2 pl-3 pr-11 text-body text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary-subtle",
            error ? "border-danger" : "border-border",
            className,
          ].filter(Boolean).join(" ")}
          {...props}
        >
          {children}
        </select>
        <CaretDownIcon
          aria-hidden="true"
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-foreground-muted"
          size={18}
          weight="bold"
        />
      </div>
      {error ? <p id={`${id}-error`} className="mt-2 text-caption text-danger">{error}</p> : null}
    </div>
  );
});
