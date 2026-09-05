export type LedgerAmount = {
  amountMinor: number;
  memberId: string;
};

export type BalanceExpense = {
  currency: string;
  payments: LedgerAmount[];
  shares: LedgerAmount[];
  totalMinor: number;
};

export type BalanceSettlement = {
  amountMinor: number;
  currency: string;
  payeeId: string;
  payerId: string;
};

export type MemberBalance = {
  memberId: string;
  netMinor: number;
};

export type CurrencyBalances = {
  balances: MemberBalance[];
  currency: string;
};

export type SuggestedTransfer = {
  amountMinor: number;
  currency: string;
  payeeId: string;
  payerId: string;
};

function compareIds(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function assertCurrency(currency: string): void {
  if (!/^[A-Z]{3}$/.test(currency)) throw new Error("Currency must be a three-letter ISO code.");
}

function assertMinor(value: number, allowZero: boolean): void {
  if (!Number.isSafeInteger(value) || value < 0 || (!allowZero && value === 0)) {
    throw new Error("Ledger amounts must be safe integers in minor units.");
  }
}

function safeNumber(value: bigint): number {
  const result = Number(value);
  if (!Number.isSafeInteger(result)) throw new Error("The calculated balance exceeds the safe integer range.");
  return result;
}

export function calculateMemberBalances({
  currencies = [],
  expenses,
  memberIds,
  settlements,
}: {
  currencies?: string[];
  expenses: BalanceExpense[];
  memberIds: string[];
  settlements: BalanceSettlement[];
}): CurrencyBalances[] {
  if (memberIds.length === 0 || new Set(memberIds).size !== memberIds.length) {
    throw new Error("Balances require unique group members.");
  }
  const members = new Set(memberIds);
  const byCurrency = new Map<string, Map<string, bigint>>();

  function currencyBalances(currency: string) {
    assertCurrency(currency);
    let balances = byCurrency.get(currency);
    if (!balances) {
      balances = new Map(memberIds.map((memberId) => [memberId, BigInt(0)]));
      byCurrency.set(currency, balances);
    }
    return balances;
  }

  for (const currency of currencies) currencyBalances(currency);

  for (const expense of expenses) {
    assertMinor(expense.totalMinor, false);
    const balances = currencyBalances(expense.currency);
    let paymentTotal = BigInt(0);
    let shareTotal = BigInt(0);

    for (const payment of expense.payments) {
      assertMinor(payment.amountMinor, false);
      if (!members.has(payment.memberId)) throw new Error("Every payer must be a group member.");
      paymentTotal += BigInt(payment.amountMinor);
      balances.set(payment.memberId, balances.get(payment.memberId)! + BigInt(payment.amountMinor));
    }
    for (const share of expense.shares) {
      assertMinor(share.amountMinor, true);
      if (!members.has(share.memberId)) throw new Error("Every participant must be a group member.");
      shareTotal += BigInt(share.amountMinor);
      balances.set(share.memberId, balances.get(share.memberId)! - BigInt(share.amountMinor));
    }
    if (paymentTotal !== BigInt(expense.totalMinor) || shareTotal !== BigInt(expense.totalMinor)) {
      throw new Error("Expense payments and shares must reconcile to the total.");
    }
  }

  for (const settlement of settlements) {
    assertMinor(settlement.amountMinor, false);
    if (settlement.payerId === settlement.payeeId) throw new Error("Settlement members must differ.");
    if (!members.has(settlement.payerId) || !members.has(settlement.payeeId)) {
      throw new Error("Settlement members must belong to the group.");
    }
    const balances = currencyBalances(settlement.currency);
    balances.set(settlement.payerId, balances.get(settlement.payerId)! + BigInt(settlement.amountMinor));
    balances.set(settlement.payeeId, balances.get(settlement.payeeId)! - BigInt(settlement.amountMinor));
  }

  return Array.from(byCurrency.entries())
    .sort(([left], [right]) => compareIds(left, right))
    .map(([currency, balances]) => {
      const rows = Array.from(balances.entries())
        .sort(([left], [right]) => compareIds(left, right))
        .map(([memberId, netMinor]) => ({ memberId, netMinor: safeNumber(netMinor) }));
      if (rows.reduce((sum, row) => sum + BigInt(row.netMinor), BigInt(0)) !== BigInt(0)) {
        throw new Error("Group balances must reconcile to zero.");
      }
      return { balances: rows, currency };
    });
}

export function simplifyDebts(currencyBalances: CurrencyBalances): SuggestedTransfer[] {
  assertCurrency(currencyBalances.currency);
  const ids = currencyBalances.balances.map(({ memberId }) => memberId);
  if (new Set(ids).size !== ids.length) throw new Error("Member balances must be unique.");

  const total = currencyBalances.balances.reduce((sum, balance) => {
    if (!Number.isSafeInteger(balance.netMinor)) throw new Error("Member balances must use integer minor units.");
    return sum + BigInt(balance.netMinor);
  }, BigInt(0));
  if (total !== BigInt(0)) throw new Error("Member balances must reconcile to zero.");

  const debtors = currencyBalances.balances
    .filter(({ netMinor }) => netMinor < 0)
    .map(({ memberId, netMinor }) => ({ memberId, remaining: BigInt(-netMinor) }))
    .sort((left, right) => compareIds(left.memberId, right.memberId));
  const creditors = currencyBalances.balances
    .filter(({ netMinor }) => netMinor > 0)
    .map(({ memberId, netMinor }) => ({ memberId, remaining: BigInt(netMinor) }))
    .sort((left, right) => compareIds(left.memberId, right.memberId));
  const transfers: SuggestedTransfer[] = [];
  let debtorIndex = 0;
  let creditorIndex = 0;

  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex];
    const creditor = creditors[creditorIndex];
    const amount = debtor.remaining < creditor.remaining ? debtor.remaining : creditor.remaining;
    transfers.push({
      amountMinor: safeNumber(amount),
      currency: currencyBalances.currency,
      payeeId: creditor.memberId,
      payerId: debtor.memberId,
    });
    debtor.remaining -= amount;
    creditor.remaining -= amount;
    if (debtor.remaining === BigInt(0)) debtorIndex += 1;
    if (creditor.remaining === BigInt(0)) creditorIndex += 1;
  }

  return transfers;
}
