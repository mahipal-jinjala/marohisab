import { tr } from "@/lib/i18n";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, Loading, PageHeader, Stat, useOpenTxn } from "@/components/AppShell";
import { AccountTable, NewAccountButton } from "@/components/AccountsPanel";
import { TxnList } from "@/components/TxnList";
import { formatINR } from "@/lib/accounting";
import { todayISO, useEntries, useTotals } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/loans")({
  head: () => ({ meta: [{ title: tr("લોન અને ઉધાર — મારો હિસાબ") }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }, { name: "description", content: tr("લીધેલી લોન, આપેલ ઉધાર, ચૂકવણી અને વ્યાજ.") }, { property: "og:title", content: tr("લોન અને ઉધાર — મારો હિસાબ") }, { property: "og:description", content: tr("લીધેલી લોન, આપેલ ઉધાર, ચૂકવણી અને વ્યાજ.") }] }),
  component: Loans,
});

const LOAN_KINDS = new Set(["loan_taken", "loan_repay", "lend", "lend_collect", "opening_liability"]);

function Loans() {
  const { accounts, totals, isLoading } = useTotals("2000-01-01", todayISO());
  const entries = useEntries({ limit: 300 });
  const open = useOpenTxn();
  const live = accounts.filter((a) => !a.is_archived);
  return (
    <div className="space-y-4">
      <PageHeader title={tr("લોન અને ઉધાર")}>
        <NewAccountButton subtypes={["loan_payable", "other_liability"]} withParty label={tr("નવી લોન")} />
        <NewAccountButton subtypes={["receivable"]} withParty label={tr("નવું લેણું")} />
      </PageHeader>
      {isLoading || !totals ? <Loading /> : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat tone="bad" label={tr("બાકી લોન (કુલ)")} value={formatINR(totals.loans)} />
            <Stat tone="bad" label={tr("બાકી વ્યક્તિગત લોન")} value={formatINR(totals.personalLoans)} />
            <Stat tone="good" label={tr("લેવાના બાકી (ઉધાર આપેલ)")} value={formatINR(totals.receivables)} />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Button size="lg" className="min-h-14 h-auto whitespace-normal py-3" onClick={() => open({ kind: "loan_taken" })}>{tr("લોન લીધી")}</Button>
            <Button size="lg" variant="outline" className="min-h-14 h-auto whitespace-normal py-3" onClick={() => open({ kind: "loan_repay" })}>{tr("લોન ચૂકવી + વ્યાજ")}</Button>
            <Button size="lg" variant="outline" className="min-h-14 h-auto whitespace-normal py-3" onClick={() => open({ kind: "lend" })}>{tr("ઉધાર આપ્યા")}</Button>
            <Button size="lg" variant="outline" className="min-h-14 h-auto whitespace-normal py-3" onClick={() => open({ kind: "lend_collect" })}>{tr("ઉધાર પાછા મળ્યા")}</Button>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card title={tr("લીધેલી લોન")}><AccountTable accounts={live.filter((a) => a.type === "liability")} totals={totals} /></Card>
            <Card title={tr("આપેલ ઉધાર (લેણું)")}><AccountTable accounts={live.filter((a) => a.subtype === "receivable")} totals={totals} /></Card>
          </div>
        </>
      )}
      <Card title={tr("લોન વ્યવહારો")}>
        <TxnList entries={(entries.data ?? []).filter((e) => LOAN_KINDS.has(e.kind))} accounts={accounts} onEdit={open} />
      </Card>
    </div>
  );
}
