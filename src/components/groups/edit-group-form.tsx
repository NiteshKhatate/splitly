"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { Textarea } from "@/components/ui/textarea";
import { TextField } from "@/components/ui/text-field";
import { showToast } from "@/components/ui/toast";
import {
  GROUP_DESCRIPTION_MAX_LENGTH,
  GROUP_NAME_MAX_LENGTH,
  type UpdateGroupFormFields,
  updateGroupFormSchema,
} from "@/lib/validations/groups";
import { zodResolver } from "@/lib/validations/zod-resolver";

export function EditGroupForm({
  description,
  groupId,
  name,
}: {
  description: string | null;
  groupId: string;
  name: string;
}) {
  const router = useRouter();
  const form = useForm<UpdateGroupFormFields>({
    defaultValues: { description: description ?? "", name },
    resolver: zodResolver(updateGroupFormSchema),
  });

  async function submit(values: UpdateGroupFormFields) {
    const response = await fetch(`/groups/${groupId}/update`, {
      body: JSON.stringify(values),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    }).catch(() => null);
    const result = response
      ? await response.json().catch(() => null) as { message?: string } | null
      : null;

    if (!response?.ok) {
      const message = result?.message ?? "We couldn't update that group.";
      form.setError("root", { message });
      showToast({ message, tone: "error" });
      return;
    }

    form.reset(values);
    showToast({ message: "Group updated.", tone: "success" });
    router.push(`/groups/${groupId}`);
    router.refresh();
  }

  return (
    <form className="space-y-6" noValidate onSubmit={form.handleSubmit(submit)}>
      {form.formState.errors.root?.message ? (
        <FormMessage tone="error">{form.formState.errors.root.message}</FormMessage>
      ) : null}
      <TextField
        error={form.formState.errors.name?.message}
        id="group-name"
        label="Group name"
        maxLength={GROUP_NAME_MAX_LENGTH}
        required
        {...form.register("name", { onChange: () => form.clearErrors("root") })}
      />
      <Textarea
        error={form.formState.errors.description?.message}
        helperText="Optional."
        id="group-description"
        label="Description"
        maxLength={GROUP_DESCRIPTION_MAX_LENGTH}
        {...form.register("description", { onChange: () => form.clearErrors("root") })}
      />
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button className="w-full sm:w-auto" href={`/groups/${groupId}`} variant="secondary">Cancel</Button>
        <Button className="w-full sm:w-auto" disabled={form.formState.isSubmitting} type="submit">
          {form.formState.isSubmitting ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
