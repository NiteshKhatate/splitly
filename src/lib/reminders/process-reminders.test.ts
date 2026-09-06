import { processBalanceReminders } from "./process-reminders";

function database(group: unknown) {
  return {
    group: { findMany: jest.fn().mockResolvedValue(group ? [group] : []) },
    reminderDelivery: {
      create: jest.fn().mockResolvedValue({ id: "delivery-1" }),
      update: jest.fn().mockResolvedValue({}),
    },
  };
}

const group = {
  defaultCurrency: "INR",
  expenses: [{
    currency: "INR",
    payments: [{ amountMinor: 10000, payerId: "creditor" }],
    shares: [
      { owedMinor: 5000, participantId: "creditor" },
      { owedMinor: 5000, participantId: "debtor" },
    ],
    totalMinor: 10000,
  }],
  id: "group-1",
  members: [
    { user: { email: "creditor@example.com", id: "creditor", remindersEnabled: true } },
    { user: { email: "debtor@example.com", id: "debtor", remindersEnabled: true } },
  ],
  name: "Flatmates",
  settlements: [],
};

describe("processBalanceReminders", () => {
  it("contacts only opted-in members with an outstanding balance", async () => {
    const db = database(group);
    const send = jest.fn().mockResolvedValue({ providerId: "provider-1" });

    const result = await processBalanceReminders(db as never, send, new Date("2026-09-05T08:00:00Z"));

    expect(send).toHaveBeenCalledWith({
      amountMinor: 5000,
      currency: "INR",
      email: "debtor@example.com",
      groupName: "Flatmates",
    });
    expect(send).not.toHaveBeenCalledWith(expect.objectContaining({ email: "creditor@example.com" }));
    expect(result).toEqual({ attempted: 1, failed: 0, sent: 1, skipped: 0 });
    expect(db.reminderDelivery.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ dedupeKey: "2026-09-05:group-1:debtor:INR" }),
    }));
  });

  it("does not contact members who disabled reminders", async () => {
    const optedOut = {
      ...group,
      members: group.members.map((member) => member.user.id === "debtor"
        ? { user: { ...member.user, remindersEnabled: false } }
        : member),
    };
    const db = database(optedOut);
    const send = jest.fn();

    expect(await processBalanceReminders(db as never, send)).toEqual({ attempted: 0, failed: 0, sent: 0, skipped: 0 });
    expect(send).not.toHaveBeenCalled();
  });

  it("uses the unique delivery key to skip duplicate daily reminders", async () => {
    const db = database(group);
    db.reminderDelivery.create.mockRejectedValue({ code: "P2002" });
    const send = jest.fn();

    expect(await processBalanceReminders(db as never, send)).toEqual({ attempted: 1, failed: 0, sent: 0, skipped: 1 });
    expect(send).not.toHaveBeenCalled();
  });

  it("logs delivery failures without exposing provider details", async () => {
    const db = database(group);
    const send = jest.fn().mockRejectedValue(Object.assign(new Error("secret provider message"), { code: "PROVIDER_503" }));

    expect(await processBalanceReminders(db as never, send)).toEqual({ attempted: 1, failed: 1, sent: 0, skipped: 0 });
    expect(db.reminderDelivery.update).toHaveBeenCalledWith({
      data: { failureCode: "PROVIDER_503", status: "FAILED" },
      where: { id: "delivery-1" },
    });
  });
});
