import { reminderPreferencesSchema } from "./reminders";

describe("reminderPreferencesSchema", () => {
  it("accepts an explicit reminder preference", () => {
    expect(reminderPreferencesSchema.parse({ remindersEnabled: true })).toEqual({ remindersEnabled: true });
    expect(reminderPreferencesSchema.parse({ remindersEnabled: false })).toEqual({ remindersEnabled: false });
  });

  it("rejects missing and coerced preferences", () => {
    expect(reminderPreferencesSchema.safeParse({}).success).toBe(false);
    expect(reminderPreferencesSchema.safeParse({ remindersEnabled: "true" }).success).toBe(false);
  });
});
