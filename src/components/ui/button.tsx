import Link from "next/link";
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from "react";

type ButtonVariant = "primary" | "secondary";

type SharedButtonProps = {
  children: ReactNode;
  className?: string;
  variant?: ButtonVariant;
};

type LinkButtonProps = SharedButtonProps &
  Pick<AnchorHTMLAttributes<HTMLAnchorElement>, "aria-label" | "target" | "rel"> & {
  href: string;
};

type NativeButtonProps = SharedButtonProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: never;
  };

type ButtonProps = LinkButtonProps | NativeButtonProps;

function getButtonClassName({
  className,
  variant = "primary",
}: {
  className?: string;
  variant?: ButtonVariant;
}) {
  const baseClass =
    "inline-flex min-h-11 max-w-full items-center justify-center rounded-control px-4 py-2 text-center text-label transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-60";

  const variantClass =
    variant === "primary"
      ? "bg-primary text-white hover:bg-primary-hover disabled:hover:bg-primary"
      : "border border-border bg-surface text-foreground hover:bg-surface-muted disabled:hover:bg-surface";

  return [baseClass, variantClass, className].filter(Boolean).join(" ");
}

export function Button(props: ButtonProps) {
  if ("href" in props && props.href) {
    const { className, variant = "primary", ...linkProps } = props;

    return (
      <Link
        className={getButtonClassName({ className, variant })}
        {...linkProps}
      />
    );
  }

  const { className, variant = "primary", ...buttonProps } = props;

  return (
    <button
      className={getButtonClassName({ className, variant })}
      {...buttonProps}
    />
  );
}
