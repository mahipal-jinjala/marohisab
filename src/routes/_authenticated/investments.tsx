import { tr } from "@/lib/i18n";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, Loading, PageHeader, Stat, useOpenTxn } from "@/components/AppShell";
import { AccountTable, NewAccountButton } from "@/components/AccountsPanel";
import { TxnList } from "@/components/TxnList";
import { formatINR } from "@/lib/accounting";
import { todayISO, useEntries, useTotals } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/investments")({
  head: () => ({ meta: [{ title: tr("રોકાણ અને મિલકત — મારો હિસાબ") }, { name: "description", content: tr("FD, RD, શેર, મ્યુચ્યુઅલ ફંડ, સોનું અને વ્યવસાયિક રોકાણ.") }] }),
  component: Inv,
});
const KINDS = new Set(["invest", "invest_redeem", "asset_buy", "asset_sell"]);

function Inv() {
  const { accounts, totals, isLoading } = useTotals("2000-01-01", todayISO());
  const entries = useEntries({ limit: 300 });
  const open = useOpenTxn();
  const live = accounts.filter((a) => !a.is_archived);
  return (
    <div className="space-y-4">
      <PageHeader title={tr("રોકાણ અને મિલકત")}>
        <NewAccountButton subtypes={["investment", "fixed_asset"]} label={tr("નવું રોકાણ / મિલકત")} />
      </PageHeader>
      {isLoading || !totals ? <Loading /> : (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <Stat tone="hero" label={tr("કુલ નાણાકીય રોકાણ")} value={formatINR(totals.investments)} />
            <Stat label={tr("કુલ સ્થાવર / વ્યવસાયિક મિલકત")} value={formatINR(totals.fixedAssets)} />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Button size="lg" className="h-14" onClick={() => open({ kind: "invest" })}>{tr("રોકાણ કર્યું")}</Button>
            <Button size="lg" variant="outline" className="h-14" onClick={() => open({ kind: "invest_redeem" })}>{tr("રોકાણ ઉપાડ્યું")}</Button>
            <Button size="lg" variant="outline" className="h-14" onClick={() => open({ kind: "asset_buy" })}>{tr("મિલકત ખરીદી")}</Button>
            <Button size="lg" variant="outline" className="h-14" onClick={() => open({ kind: "asset_sell" })}>{tr("મિલકત વેચી")}</Button>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card title={tr("નાણાકીય રોકાણ")}><AccountTable accounts={live.filter((a) => a.subtype === "investment")} totals={totals} /></Card>
            <Card title={tr("મિલકત (વ્યવસાયિક સહિત)")}><AccountTable accounts={live.filter((a) => a.subtype === "fixed_asset")} totals={totals} /></Card>
          </div>
        </>
      )}
      <Card title={tr("રોકાણ વ્યવહારો")}><TxnList entries={(entries.data ?? []).filter((e) => KINDS.has(e.kind))} accounts={accounts} onEdit={open} /></Card>
    </div>
  );
}
