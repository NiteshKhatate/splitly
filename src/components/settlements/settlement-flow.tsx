"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useState,
} from "react";

import { SettlementPanel } from "@/components/settlements/settlement-panel";
import { Button } from "@/components/ui/button";

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
  selected: SettlementSelection | undefined;
  select: (selection: SettlementSelection) => void;
} | null>(null);

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

  return (
    <SettlementSelectionContext.Provider value={{ selected, select: setSelected }}>
      {children}
      <SettlementPanel
        currencies={currencies}
        defaults={selected ? { amount: selected.amount, currency: selected.currency } : undefined}
        groupId={groupId}
        payee={selected?.payee}
        payer={payer}
      />
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

  return (
    <Button
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
