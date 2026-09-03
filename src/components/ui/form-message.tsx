type FormMessageProps = {
  tone: "error" | "success";
  children: string;
};

export function FormMessage({ tone, children }: FormMessageProps) {
  return (
    <div
      className={[
        "rounded-control border px-4 py-3 text-secondary break-words",
        tone === "success"
          ? "border-success bg-success-subtle text-success"
          : "border-danger bg-danger-subtle text-danger",
      ].join(" ")}
      role={tone === "error" ? "alert" : "status"}
    >
      {children}
    </div>
  );
}
