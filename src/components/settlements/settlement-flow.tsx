"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

import { SettlementPanel } from "@/components/settlements/settlement-panel";
import { Button } from "@/components/ui/button";
import { Toast } from "@/components/ui/toast";

type SettlementMember = {
  id: string;
  name: string;
};

type SettlementSelection = {
  amount: string;
  currency: string;
  payee: SettlementMember;
};

const SettlementSelectionContext = createContext<{
  completedRepayments: string[];
  selected: SettlementSelection | undefined;
  select: (selection: SettlementSelection) => void;
} | null>(null);

function repaymentKey({ amount, currency, payee }: SettlementSelection): string {
  return `${payee.id}:${currency}:${amount}`;
}

export function SettlementFlow({
  children,
  currencies,
  groupId,
  payer,
}: {
  children: ReactNode;
  currencies: string[];
  groupId: string;
  payer: SettlementMember;
}) {
  const [selected, setSelected] = useState<SettlementSelection>();
  const [successful, setSuccessful] = useState<SettlementSelection>();
  const [completedRepayments, setCompletedRepayments] = useState<string[]>([]);

  useEffect(() => {
    if (selected) document.getElementById("settlement-amount")?.focus();
  }, [selected]);

  function select(selection: SettlementSelection) {
    setSelected(selection);
    setSuccessful(undefined);
  }

  function complete(selection: SettlementSelection) {
    setCompletedRepayments((repayments) => [
      ...repayments,
      repaymentKey(selection),
    ]);
    setSuccessful(selection);
    setSelected(undefined);
  }

  return (
    <SettlementSelectionContext.Provider value={{ completedRepayments, selected, select }}>
      {children}
      <SettlementPanel
        currencies={currencies}
        defaults={selected ? { amount: selected.amount, currency: selected.currency } : undefined}
        groupId={groupId}
        onSuccess={selected ? () => complete(selected) : undefined}
        payee={selected?.payee}
        payer={payer}
      />
      {successful ? (
        <Toast onDismiss={() => setSuccessful(undefined)} tone="success">
          {`Your settlement to ${successful.payee.name} was recorded and is awaiting confirmation.`}
        </Toast>
      ) : null}
    </SettlementSelectionContext.Provider>
  );
}

export function SettleUpButton({
  amount,
  currency,
  payee,
}: SettlementSelection) {
  const context = useContext(SettlementSelectionContext);

  if (!context) {
    throw new Error("SettleUpButton must be rendered inside SettlementFlow.");
  }

  const isSelected =
    context.selected?.currency === currency && context.selected.payee.id === payee.id;

  if (context.completedRepayments.includes(repaymentKey({ amount, currency, payee }))) {
    return null;
  }

  return (
    <Button
      className="w-full sm:w-auto"
      type="button"
      variant="secondary"
      aria-controls="settle-up"
      aria-expanded={isSelected}
      onClick={() => context.select({ amount, currency, payee })}
    >
      Settle up
    </Button>
  );
}
