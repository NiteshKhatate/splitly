export const PERCENTAGE_BASIS_POINTS_TOTAL = 10_000;

export type SplitMethod = "EQUAL" | "EXACT" | "PERCENTAGE" | "SHARES";

export type SplitAllocation = {
  owedMinor: number;
  participantId: string;
};

export type ExactSplitInput = {
  amountMinor: number;
  participantId: string;
};

export type PercentageSplitInput = {
  participantId: string;
  percentageBasisPoints: number;
};

export type SharesSplitInput = {
  participantId: string;
  shares: number;
};

export type SplitCalculationInput =
  | {
      method: "EQUAL";
      participantIds: string[];
      totalMinor: number;
    }
  | {
      allocations: ExactSplitInput[];
      method: "EXACT";
      totalMinor: number;
    }
  | {
      allocations: PercentageSplitInput[];
      method: "PERCENTAGE";
      totalMinor: number;
    }
  | {
      allocations: SharesSplitInput[];
      method: "SHARES";
      totalMinor: number;
    };

type WeightedParticipant = {
  participantId: string;
  weight: number;
};

function compareParticipantIds(left: string, right: string): number {
  if (left < right) {
    return -1;
  }

  if (left > right) {
    return 1;
  }

  return 0;
}

function assertPositiveTotal(totalMinor: number): void {
  if (!Number.isSafeInteger(totalMinor) || totalMinor <= 0) {
    throw new RangeError("The expense total must be a positive integer in minor units.");
  }
}

function assertParticipants(participantIds: string[]): void {
  if (participantIds.length === 0) {
    throw new RangeError("At least one participant is required.");
  }

  const uniqueParticipantIds = new Set<string>();

  for (const participantId of participantIds) {
    if (participantId.trim().length === 0) {
      throw new TypeError("Participant IDs cannot be empty.");
    }

    if (uniqueParticipantIds.has(participantId)) {
      throw new Error(`Participant ${participantId} appears more than once.`);
    }

    uniqueParticipantIds.add(participantId);
  }
}

function assertNonnegativeSafeInteger(value: number, label: string): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(`${label} must be a nonnegative safe integer.`);
  }
}

function allocateProportionally(
  totalMinor: number,
  participants: WeightedParticipant[],
): SplitAllocation[] {
  assertPositiveTotal(totalMinor);
  assertParticipants(participants.map(({ participantId }) => participantId));

  let totalWeight = BigInt(0);

  for (const participant of participants) {
    assertNonnegativeSafeInteger(participant.weight, "Split weight");
    totalWeight += BigInt(participant.weight);
  }

  if (totalWeight <= BigInt(0)) {
    throw new RangeError("Split weights must have a positive total.");
  }

  const total = BigInt(totalMinor);
  const calculated = participants.map(({ participantId, weight }, inputIndex) => {
    const numerator = total * BigInt(weight);

    return {
      inputIndex,
      owedMinor: numerator / totalWeight,
      participantId,
      remainder: numerator % totalWeight,
    };
  });
  const allocatedMinor = calculated.reduce(
    (sum, participant) => sum + participant.owedMinor,
    BigInt(0),
  );
  const remainderMinor = Number(total - allocatedMinor);

  const remainderOrder = [...calculated].sort((left, right) => {
    if (left.remainder !== right.remainder) {
      return left.remainder > right.remainder ? -1 : 1;
    }

    return compareParticipantIds(left.participantId, right.participantId);
  });

  for (let index = 0; index < remainderMinor; index += 1) {
    remainderOrder[index].owedMinor += BigInt(1);
  }

  return calculated
    .sort((left, right) => left.inputIndex - right.inputIndex)
    .map(({ owedMinor, participantId }) => ({
      owedMinor: Number(owedMinor),
      participantId,
    }));
}

export function calculateEqualSplit(
  totalMinor: number,
  participantIds: string[],
): SplitAllocation[] {
  return allocateProportionally(
    totalMinor,
    participantIds.map((participantId) => ({ participantId, weight: 1 })),
  );
}

export function calculateExactSplit(
  totalMinor: number,
  allocations: ExactSplitInput[],
): SplitAllocation[] {
  assertPositiveTotal(totalMinor);
  assertParticipants(allocations.map(({ participantId }) => participantId));

  let allocatedMinor = BigInt(0);

  for (const allocation of allocations) {
    assertNonnegativeSafeInteger(allocation.amountMinor, "Exact split amount");
    allocatedMinor += BigInt(allocation.amountMinor);
  }

  if (allocatedMinor !== BigInt(totalMinor)) {
    throw new Error("Exact split amounts must equal the expense total.");
  }

  return allocations.map(({ amountMinor, participantId }) => ({
    owedMinor: amountMinor,
    participantId,
  }));
}

export function calculatePercentageSplit(
  totalMinor: number,
  allocations: PercentageSplitInput[],
): SplitAllocation[] {
  let percentageTotal = 0;

  for (const allocation of allocations) {
    assertNonnegativeSafeInteger(
      allocation.percentageBasisPoints,
      "Percentage basis points",
    );
    percentageTotal += allocation.percentageBasisPoints;
  }

  if (percentageTotal !== PERCENTAGE_BASIS_POINTS_TOTAL) {
    throw new Error("Percentage splits must total exactly 100%.");
  }

  return allocateProportionally(
    totalMinor,
    allocations.map(({ participantId, percentageBasisPoints }) => ({
      participantId,
      weight: percentageBasisPoints,
    })),
  );
}

export function calculateSharesSplit(
  totalMinor: number,
  allocations: SharesSplitInput[],
): SplitAllocation[] {
  for (const allocation of allocations) {
    if (!Number.isSafeInteger(allocation.shares) || allocation.shares <= 0) {
      throw new RangeError("Each participant must have a positive integer share weight.");
    }
  }

  return allocateProportionally(
    totalMinor,
    allocations.map(({ participantId, shares }) => ({
      participantId,
      weight: shares,
    })),
  );
}

export function calculateSplit(input: SplitCalculationInput): SplitAllocation[] {
  switch (input.method) {
    case "EQUAL":
      return calculateEqualSplit(input.totalMinor, input.participantIds);
    case "EXACT":
      return calculateExactSplit(input.totalMinor, input.allocations);
    case "PERCENTAGE":
      return calculatePercentageSplit(input.totalMinor, input.allocations);
    case "SHARES":
      return calculateSharesSplit(input.totalMinor, input.allocations);
  }
}
