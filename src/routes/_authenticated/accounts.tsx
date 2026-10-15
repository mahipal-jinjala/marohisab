import { tr } from "@/lib/i18n";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, Loading, PageHeader, useOpenTxn } from "@/components/AppShell";
import { AccountTable, NewAccountButton } from "@/components/AccountsPanel";
import type { AccType, Subtype } from "@/lib/accounting";
import { monthStartISO, todayISO, useTotals } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/accounts")({
  head: () => ({ meta: [{ title: tr("ખાતાં — મારો હિસાબ") }, { name: "description", content: tr("ખાતાવહી અને ખાતાંઓની યાદી.") }] }),
  component: Accounts,
});

const ALL: Subtype[] = ["cash", "bank", "upi", "income", "expense", "receivable", "investment", "fixed_asset", "loan_payable", "other_liability", "equity"];
const GROUPS: { t: AccType; l: string; period?: boolean }[] = [
  { t: "asset", l: tr("મિલકત (Assets)") }, { t: "liability", l: tr("દેવું (Liabilities)") },
  { t: "income", l: tr("આવક — આ મહિને"), period: true }, { t: "expense", l: tr("ખર્ચ — આ મહિને"), period: true }, { t: "equity", l: tr("મૂડી") },
];

function Accounts() {
  const { accounts, totals, isLoading } = useTotals(monthStartISO(), todayISO());
  const open = useOpenTxn();
  return (
    <div className="space-y-4">
      <PageHeader title={tr("ખાતાં (ચાર્ટ ઓફ એકાઉન્ટ્સ)")}>
        <Button variant="outline" onClick={() => open({ kind: "opening_asset" })}>{tr("શરૂઆતનું બેલેન્સ")}</Button>
        <NewAccountButton subtypes={ALL} withParty label={tr("નવું ખાતું / કેટેગરી")} />
      </PageHeader>
      {isLoading ? <Loading /> : (
        <div className="grid gap-4 lg:grid-cols-2">
          {GROUPS.map((g) => (
            <Card key={g.t} title={g.l}><AccountTable accounts={accounts.filter((a) => a.type === g.t && !a.is_archived)} totals={totals} period={g.period} /></Card>
          ))}
        </div>
      )}
    </div>
  );
}
