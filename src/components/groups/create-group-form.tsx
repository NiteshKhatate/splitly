"use client";

import { type FormEvent, useActionState, useRef } from "react";
import { useFormStatus } from "react-dom";
import { useForm } from "react-hook-form";

import { createGroupAction } from "@/app/(dashboard)/groups/new/actions";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { Textarea } from "@/components/ui/textarea";
import { TextField } from "@/components/ui/text-field";
import { initialCreateGroupFormState } from "@/lib/groups/create-group-form-state";
import {
  createGroupFormSchema,
  type CreateGroupFormFields,
  GROUP_DESCRIPTION_MAX_LENGTH,
  GROUP_NAME_MAX_LENGTH,
} from "@/lib/validations/groups";
import { zodResolver } from "@/lib/validations/zod-resolver";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full sm:w-auto" disabled={pending}>
      {pending ? "Creating..." : "Create group"}
    </Button>
  );
}

export function CreateGroupForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const isValidatedSubmit = useRef(false);
  const [state, formAction] = useActionState(
    createGroupAction,
    initialCreateGroupFormState,
  );
  const formState = state ?? initialCreateGroupFormState;
  const {
    formState: { errors },
    handleSubmit: handleValidatedSubmit,
    register,
  } = useForm<CreateGroupFormFields>({
    defaultValues: formState.fields,
    resolver: zodResolver(createGroupFormSchema),
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (isValidatedSubmit.current) {
      isValidatedSubmit.current = false;
      return;
    }

    event.preventDefault();
    void handleValidatedSubmit(() => {
      isValidatedSubmit.current = true;
      formRef.current?.requestSubmit();
    })(event);
  }

  return (
    <form ref={formRef} action={formAction} className="space-y-6" onSubmit={handleSubmit} noValidate>
      {formState.message ? <FormMessage tone="error">{formState.message}</FormMessage> : null}

      <TextField
        id="group-name"
        label="Group name"
        error={errors.name?.message ?? formState.errors.name}
        helperText={`Use ${GROUP_NAME_MAX_LENGTH} characters or less.`}
        maxLength={GROUP_NAME_MAX_LENGTH}
        required
        {...register("name")}
      />

      <Textarea
        id="group-description"
        label="Description"
        error={errors.description?.message ?? formState.errors.description}
        helperText={`Optional. Use ${GROUP_DESCRIPTION_MAX_LENGTH} characters or less.`}
        maxLength={GROUP_DESCRIPTION_MAX_LENGTH}
        {...register("description")}
      />

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
        <Button href="/groups" variant="secondary" className="w-full sm:w-auto">
          Cancel
        </Button>
        <SubmitButton />
      </div>

      <p className="text-caption text-foreground-muted">
        You will be added as the group admin. Members can be added from the group page later.
      </p>
    </form>
  );
}
