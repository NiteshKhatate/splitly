import type { FieldErrors, FieldValues, Resolver } from "react-hook-form";
import type { z } from "zod";

export function zodResolver<TValues extends FieldValues>(
  schema: z.ZodType<TValues>,
): Resolver<TValues> {
  return async (values) => {
    const result = schema.safeParse(values);

    if (result.success) {
      return {
        values: result.data,
        errors: {},
      };
    }

    const errors: FieldErrors<FieldValues> = {};

    for (const issue of result.error.issues) {
      const fieldName = issue.path.join(".");

      if (!fieldName || errors[fieldName]) {
        continue;
      }

      errors[fieldName] = {
        type: issue.code,
        message: issue.message,
      };
    }

    return {
      values: {},
      errors: errors as FieldErrors<TValues>,
    };
  };
}
