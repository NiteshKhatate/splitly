"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { createGroupAction } from "@/app/(dashboard)/groups/new/actions";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { Textarea } from "@/components/ui/textarea";
import { TextField } from "@/components/ui/text-field";
import { initialCreateGroupFormState } from "@/lib/groups/create-group-form-state";
import {
  GROUP_DESCRIPTION_MAX_LENGTH,
  GROUP_NAME_MAX_LENGTH,
} from "@/lib/validations/groups";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full sm:w-auto" disabled={pending}>
      {pending ? "Creating..." : "Create group"}
    </Button>
  );
}

export function CreateGroupForm() {
  const [state, formAction] = useActionState(
    createGroupAction,
    initialCreateGroupFormState,
  );
  const formState = state ?? initialCreateGroupFormState;

  return (
    <form action={formAction} className="space-y-6" noValidate>
      {formState.message ? <FormMessage tone="error">{formState.message}</FormMessage> : null}

      <TextField
        id="group-name"
        name="name"
        label="Group name"
        defaultValue={formState.fields.name}
        error={formState.errors.name}
        helperText={`Use ${GROUP_NAME_MAX_LENGTH} characters or less.`}
        maxLength={GROUP_NAME_MAX_LENGTH}
        required
      />

      <Textarea
        id="group-description"
        name="description"
        label="Description"
        defaultValue={formState.fields.description}
        error={formState.errors.description}
        helperText={`Optional. Use ${GROUP_DESCRIPTION_MAX_LENGTH} characters or less.`}
        maxLength={GROUP_DESCRIPTION_MAX_LENGTH}
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
