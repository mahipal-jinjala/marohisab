import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, DateRange, Loading, PageHeader, Stat, useOpenTxn } from "@/components/AppShell";
import { TxnList } from "@/components/TxnList";
import { formatINR, type Kind } from "@/lib/accounting";
import { monthStartISO, todayISO, useEntries, useTotals } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "ડેશબોર્ડ — મારો હિસાબ" }, { name: "description", content: "તમારો નાણાકીય સારાંશ." }] }),
  component: Dashboard,
});

const QUICK: { k: Kind; l: string }[] = [
  { k: "income", l: "+ આવક" }, { k: "expense", l: "− ખર્ચ" }, { k: "loan_taken", l: "લોન લીધી" },
  { k: "loan_repay", l: "લોન ચૂકવી" }, { k: "lend", l: "ઉધાર આપ્યા" }, { k: "invest", l: "રોકાણ" }, { k: "transfer", l: "ટ્રાન્સફર" },
];

function Dashboard() {
  const [from, setFrom] = useState(monthStartISO());
  const [to, setTo] = useState(todayISO());
  const open = useOpenTxn();
  const { totals: t, accounts, isLoading, error } = useTotals(from, to);
  const recent = useEntries({ limit: 8 });
  if (error) return <p className="text-destructive">ડેટા લોડ ન થયો: {(error as Error).message}</p>;
  return (
    <div className="space-y-6">
      <PageHeader title="ડેશબોર્ડ"><DateRange from={from} to={to} onChange={(f, x) => { setFrom(f); setTo(x); }} /></PageHeader>
      {isLoading || !t ? <Loading /> : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat tone="hero" label="ઉપલબ્ધ નાણાં (રોકડ + બેંક + UPI)" value={formatINR(t.available)} hint={`રોકડ ${formatINR(t.cash)} · બેંક ${formatINR(t.bank)} · UPI ${formatINR(t.upi)}`} />
            <Stat tone={t.earnings >= 0 ? "good" : "bad"} label="ખર્ચ પછીની કમાણી" value={formatINR(t.earnings)} hint={`આવક ${formatINR(t.income)} − ખર્ચ ${formatINR(t.expense)}`} />
            <Stat tone="bad" label="બાકી વ્યક્તિગત લોન" value={formatINR(t.personalLoans)} />
            <Stat tone={t.earningsAfterLoans >= 0 ? "good" : "bad"} label="લોન બાદ કર્યા પછીની કમાણી" value={formatINR(t.earningsAfterLoans)} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="લેણું (ઉધાર આપેલ)" value={formatINR(t.receivables)} />
            <Stat label="રોકાણ" value={formatINR(t.investments)} />
            <Stat label="કુલ દેવું" value={formatINR(t.liabilities)} />
            <Stat tone={t.netWorth >= 0 ? "good" : "bad"} label="નેટ વર્થ" value={formatINR(t.netWorth)} hint={`મિલકત ${formatINR(t.assets)}`} />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label="ભેંસ ડેરી નફો / નુકસાન" tone={t.bySection.dairy.profit >= 0 ? "good" : "bad"} value={formatINR(t.bySection.dairy.profit)} />
            <Stat label="ઘરખર્ચ" value={formatINR(t.bySection.household.expense)} />
            <Stat label="ઘર વેરેન્ટેજ ખર્ચ" value={formatINR(t.bySection.ghar.expense)} />
          </div>
        </>
      )}
      <Card title="ઝડપી ઉમેરો">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {QUICK.map((q) => <Button key={q.k} size="lg" variant={q.k === "income" ? "default" : "outline"} className="h-14 text-base" onClick={() => open({ kind: q.k })}>{q.l}</Button>)}
        </div>
      </Card>
      <Card title="તાજેતરના વ્યવહારો">
        {recent.isLoading ? <Loading /> : <TxnList entries={recent.data ?? []} accounts={accounts} onEdit={open} />}
      </Card>
    </div>
  );
}
