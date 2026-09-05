import {
  calculateEqualSplit,
  calculateExactSplit,
  calculatePercentageSplit,
  calculateSharesSplit,
  calculateSplit,
  type SplitAllocation,
} from "./split-calculator";

function expectReconciled(allocations: SplitAllocation[], totalMinor: number): void {
  expect(allocations.every(({ owedMinor }) => Number.isSafeInteger(owedMinor))).toBe(true);
  expect(allocations.every(({ owedMinor }) => owedMinor >= 0)).toBe(true);
  expect(allocations.reduce((sum, { owedMinor }) => sum + owedMinor, 0)).toBe(totalMinor);
}

describe("split calculator", () => {
  describe("equal splits", () => {
    it("allocates every minor unit and resolves equal remainders by participant ID", () => {
      const allocations = calculateEqualSplit(1_000, ["member-c", "member-b", "member-a"]);

      expect(allocations).toEqual([
        { owedMinor: 333, participantId: "member-c" },
        { owedMinor: 333, participantId: "member-b" },
        { owedMinor: 334, participantId: "member-a" },
      ]);
      expectReconciled(allocations, 1_000);
    });

    it("supports a single participant", () => {
      expect(calculateEqualSplit(2_400, ["member-a"])).toEqual([
        { owedMinor: 2_400, participantId: "member-a" },
      ]);
    });

    it("can produce zero owed amounts when the total is smaller than the participant count", () => {
      const allocations = calculateEqualSplit(2, ["member-c", "member-a", "member-b"]);

      expect(allocations).toEqual([
        { owedMinor: 0, participantId: "member-c" },
        { owedMinor: 1, participantId: "member-a" },
        { owedMinor: 1, participantId: "member-b" },
      ]);
      expectReconciled(allocations, 2);
    });
  });

  describe("exact splits", () => {
    it("accepts nonnegative integer amounts that exactly reconcile", () => {
      const allocations = calculateExactSplit(1_000, [
        { amountMinor: 0, participantId: "member-a" },
        { amountMinor: 1_000, participantId: "member-b" },
      ]);

      expect(allocations).toEqual([
        { owedMinor: 0, participantId: "member-a" },
        { owedMinor: 1_000, participantId: "member-b" },
      ]);
      expectReconciled(allocations, 1_000);
    });

    it("rejects amounts that do not reconcile", () => {
      expect(() =>
        calculateExactSplit(1_000, [
          { amountMinor: 400, participantId: "member-a" },
          { amountMinor: 599, participantId: "member-b" },
        ]),
      ).toThrow("Exact split amounts must equal the expense total.");
    });
  });

  describe("percentage splits", () => {
    it("allocates basis-point percentages without losing minor units", () => {
      const allocations = calculatePercentageSplit(240_000, [
        { participantId: "alex", percentageBasisPoints: 4_000 },
        { participantId: "sam", percentageBasisPoints: 3_500 },
        { participantId: "priya", percentageBasisPoints: 2_500 },
      ]);

      expect(allocations).toEqual([
        { owedMinor: 96_000, participantId: "alex" },
        { owedMinor: 84_000, participantId: "sam" },
        { owedMinor: 60_000, participantId: "priya" },
      ]);
      expectReconciled(allocations, 240_000);
    });

    it("uses largest remainders then participant IDs for deterministic rounding", () => {
      const allocations = calculatePercentageSplit(2, [
        { participantId: "member-b", percentageBasisPoints: 3_333 },
        { participantId: "member-c", percentageBasisPoints: 3_334 },
        { participantId: "member-a", percentageBasisPoints: 3_333 },
      ]);

      expect(allocations).toEqual([
        { owedMinor: 0, participantId: "member-b" },
        { owedMinor: 1, participantId: "member-c" },
        { owedMinor: 1, participantId: "member-a" },
      ]);
      expectReconciled(allocations, 2);
    });

    it("rejects percentages that do not total exactly 100%", () => {
      expect(() =>
        calculatePercentageSplit(100, [
          { participantId: "member-a", percentageBasisPoints: 5_000 },
          { participantId: "member-b", percentageBasisPoints: 4_999 },
        ]),
      ).toThrow("Percentage splits must total exactly 100%.");
    });
  });

  describe("shares splits", () => {
    it("allocates weighted shares", () => {
      const allocations = calculateSharesSplit(1_000, [
        { participantId: "alex", shares: 1 },
        { participantId: "sam", shares: 2 },
        { participantId: "priya", shares: 1 },
      ]);

      expect(allocations).toEqual([
        { owedMinor: 250, participantId: "alex" },
        { owedMinor: 500, participantId: "sam" },
        { owedMinor: 250, participantId: "priya" },
      ]);
      expectReconciled(allocations, 1_000);
    });

    it("rejects zero, fractional, and negative weights", () => {
      for (const shares of [0, 1.5, -1]) {
        expect(() =>
          calculateSharesSplit(100, [{ participantId: "member-a", shares }]),
        ).toThrow("Each participant must have a positive integer share weight.");
      }
    });
  });

  describe("shared validation and dispatch", () => {
    it("dispatches by split method", () => {
      expect(
        calculateSplit({
          method: "EQUAL",
          participantIds: ["member-a", "member-b"],
          totalMinor: 5,
        }),
      ).toEqual([
        { owedMinor: 3, participantId: "member-a" },
        { owedMinor: 2, participantId: "member-b" },
      ]);
    });

    it.each([0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1])(
      "rejects invalid total %p",
      (totalMinor) => {
        expect(() => calculateEqualSplit(totalMinor, ["member-a"])).toThrow(
          "The expense total must be a positive integer in minor units.",
        );
      },
    );

    it("rejects empty or duplicate participants", () => {
      expect(() => calculateEqualSplit(100, [])).toThrow(
        "At least one participant is required.",
      );
      expect(() => calculateEqualSplit(100, ["member-a", "member-a"])).toThrow(
        "Participant member-a appears more than once.",
      );
      expect(() => calculateEqualSplit(100, [" "])).toThrow(
        "Participant IDs cannot be empty.",
      );
    });

    it("rejects negative, fractional, and unsafe configured values", () => {
      expect(() =>
        calculateExactSplit(100, [{ amountMinor: -100, participantId: "member-a" }]),
      ).toThrow("Exact split amount must be a nonnegative safe integer.");
      expect(() =>
        calculatePercentageSplit(100, [
          { participantId: "member-a", percentageBasisPoints: 9_999.5 },
        ]),
      ).toThrow("Percentage basis points must be a nonnegative safe integer.");
    });

    it("stays exact when intermediate multiplication would exceed safe-number precision", () => {
      const totalMinor = Number.MAX_SAFE_INTEGER;
      const allocations = calculateSharesSplit(totalMinor, [
        { participantId: "member-a", shares: Number.MAX_SAFE_INTEGER },
        { participantId: "member-b", shares: Number.MAX_SAFE_INTEGER },
      ]);

      expect(allocations).toEqual([
        { owedMinor: 4_503_599_627_370_496, participantId: "member-a" },
        { owedMinor: 4_503_599_627_370_495, participantId: "member-b" },
      ]);
      expectReconciled(allocations, totalMinor);
    });
  });
});
