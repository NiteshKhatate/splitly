import { z } from "zod";

export const reminderPreferencesSchema = z.object({
  remindersEnabled: z.boolean(),
});

export type ReminderPreferencesValues = z.infer<typeof reminderPreferencesSchema>;
