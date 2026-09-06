import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { ReminderPreferencesForm } from "./reminder-preferences-form";

describe("ReminderPreferencesForm", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it("saves an updated preference", async () => {
    const request = jest.mocked(global.fetch).mockResolvedValue({
      json: async () => ({}), ok: true,
    } as Response);
    render(<ReminderPreferencesForm remindersEnabled />);

    fireEvent.click(screen.getByRole("checkbox", { name: /email balance reminders/i }));
    fireEvent.click(screen.getByRole("button", { name: "Save preference" }));

    await waitFor(() => expect(request).toHaveBeenCalledWith("/settings/reminders", expect.objectContaining({
      body: JSON.stringify({ remindersEnabled: false }), method: "PATCH",
    })));
    expect(await screen.findByText("Reminder preference saved.")).toBeInTheDocument();
  });

  it("shows a safe retryable error", async () => {
    jest.mocked(global.fetch).mockRejectedValue(new Error("offline"));
    render(<ReminderPreferencesForm remindersEnabled={false} />);

    fireEvent.click(screen.getByRole("button", { name: "Save preference" }));

    expect(await screen.findByText("We couldn't save your reminder preference.")).toBeInTheDocument();
  });
});
