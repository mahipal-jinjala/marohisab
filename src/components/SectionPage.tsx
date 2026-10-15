import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, DateRange, Loading, PageHeader, Stat, useOpenTxn } from "@/components/AppShell";
import { AccountTable, NewAccountButton } from "@/components/AccountsPanel";
import { TxnList } from "@/components/TxnList";
import { formatINR, type Kind, type Section } from "@/lib/accounting";
import { monthStartISO, todayISO, useEntries, useTotals } from "@/lib/data";

export function SectionPage({ section, title, actions, showProfit = false, intro }:
  { section: Section; title: string; actions: { k: Kind; l: string }[]; showProfit?: boolean; intro?: string }) {
  const [from, setFrom] = useState(monthStartISO());
  const [to, setTo] = useState(todayISO());
  const { accounts, totals, isLoading } = useTotals(from, to);
  const entries = useEntries({ from, to, section });
  const open = useOpenTxn();
  const mine = accounts.filter((a) => a.section === section && !a.is_archived);
  const s = totals?.bySection[section];
  return (
    <div className="space-y-4">
      <PageHeader title={title}>
        <NewAccountButton subtypes={["expense", "income", "fixed_asset", "loan_payable", "receivable"]} section={section} withParty label="નવી કેટેગરી / ખાતું" />
      </PageHeader>
      {intro && <p className="text-muted-foreground">{intro}</p>}
      <DateRange from={from} to={to} onChange={(f, x) => { setFrom(f); setTo(x); }} />
      {isLoading || !s || !totals ? <Loading /> : (
        <>
          <div className={`grid gap-3 ${showProfit ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
            {showProfit && <Stat label="આવક" tone="good" value={formatINR(s.income)} />}
            <Stat label="ખર્ચ" tone="bad" value={formatINR(s.expense)} />
            {showProfit ? <Stat tone="hero" label="નફો / નુકસાન" value={formatINR(s.profit)} />
              : <Stat label="મિલકત (આ વિભાગ)" value={formatINR(mine.filter((a) => a.subtype === "fixed_asset").reduce((x, a) => x + (totals.balances.get(a.id)?.closing ?? 0), 0))} />}
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {actions.map((a, i) => <Button key={a.k + i} size="lg" variant={i === 0 ? "default" : "outline"} className="h-14" onClick={() => open({ kind: a.k, section })}>{a.l}</Button>)}
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card title="આવક / ખર્ચ કેટેગરી (સમયગાળો)"><AccountTable accounts={mine.filter((a) => a.type === "income" || a.type === "expense")} totals={totals} period /></Card>
            <Card title="મિલકત અને દેવું"><AccountTable accounts={mine.filter((a) => a.type === "asset" || a.type === "liability")} totals={totals} /></Card>
          </div>
        </>
      )}
      <Card title="વ્યવહારો">{entries.isLoading ? <Loading /> : <TxnList entries={entries.data ?? []} accounts={accounts} onEdit={open} />}</Card>
    </div>
  );
}
