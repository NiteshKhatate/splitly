import { SettlementForm } from "@/components/settlements/settlement-form";
import { Card } from "@/components/ui/card";
import type { SettlementFormValues } from "@/lib/validations/settlements";

type SettlementMember = {
  id: string;
  name: string;
};

export function SettlementPanel({
  currencies,
  defaults,
  groupId,
  payee,
  payer,
}: {
  currencies: string[];
  defaults?: Partial<Omit<SettlementFormValues, "payeeId">>;
  groupId: string;
  payee?: SettlementMember;
  payer: SettlementMember;
}) {
  if (!payee) return null;

  return (
    <Card className="mt-6" id="settle-up">
      <h2 className="text-card-heading">Record settlement</h2>
      <p className="mt-1 text-secondary text-foreground-muted">
        This records a payment request; Splitly does not transfer money.
      </p>
      <div className="mt-5">
        <SettlementForm
          currencies={currencies}
          defaults={defaults}
          groupId={groupId}
          payee={payee}
          payer={payer}
        />
      </div>
    </Card>
  );
}
