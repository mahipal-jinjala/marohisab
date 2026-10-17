import { tr, translatedError } from "@/lib/i18n";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, DateRange, Loading, PageHeader, Stat, useOpenTxn } from "@/components/AppShell";
import { TxnList } from "@/components/TxnList";
import { formatINR, type Kind } from "@/lib/accounting";
import { monthStartISO, todayISO, useEntries, useTotals } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: tr("ડેશબોર્ડ — મારો હિસાબ") }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }, { name: "description", content: tr("તમારો નાણાકીય સારાંશ.") }, { property: "og:title", content: tr("ડેશબોર્ડ — મારો હિસાબ") }, { property: "og:description", content: tr("તમારો નાણાકીય સારાંશ.") }] }),
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
  if (error) return <p className="text-destructive">{tr("ડેટા લોડ ન થયો:")} {translatedError(error)}</p>;
  return (
    <div className="space-y-6">
      <PageHeader title={tr("ડેશબોર્ડ")}><DateRange from={from} to={to} onChange={(f, x) => { setFrom(f); setTo(x); }} /></PageHeader>
      {isLoading || !t ? <Loading /> : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat tone="hero" label={tr("ઉપલબ્ધ નાણાં (રોકડ + બેંક + UPI)")} value={formatINR(t.available)} hint={`${tr("રોકડ")} ${formatINR(t.cash)} · ${tr("બેંક")} ${formatINR(t.bank)} · UPI ${formatINR(t.upi)}`} />
            <Stat tone={t.earnings >= 0 ? "good" : "bad"} label={tr("ખર્ચ પછીની કમાણી")} value={formatINR(t.earnings)} hint={`${tr("આવક")} ${formatINR(t.income)} − ${tr("ખર્ચ")} ${formatINR(t.expense)}`} />
            <Stat tone="bad" label={tr("બાકી વ્યક્તિગત લોન")} value={formatINR(t.personalLoans)} />
            <Stat tone={t.earningsAfterLoans >= 0 ? "good" : "bad"} label={tr("લોન બાદ કર્યા પછીની કમાણી")} value={formatINR(t.earningsAfterLoans)} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label={tr("લેણું (ઉધાર આપેલ)")} value={formatINR(t.receivables)} />
            <Stat label={tr("રોકાણ")} value={formatINR(t.investments)} />
            <Stat label={tr("કુલ દેવું")} value={formatINR(t.liabilities)} />
            <Stat tone={t.netWorth >= 0 ? "good" : "bad"} label={tr("નેટ વર્થ")} value={formatINR(t.netWorth)} hint={`${tr("મિલકત")} ${formatINR(t.assets)}`} />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label={tr("ભેંસ ડેરી નફો / નુકસાન")} tone={t.bySection.dairy.profit >= 0 ? "good" : "bad"} value={formatINR(t.bySection.dairy.profit)} />
            <Stat label={tr("ઘરખર્ચ")} value={formatINR(t.bySection.household.expense)} />
            <Stat label={tr("ઘર વેરેન્ટેજ ખર્ચ")} value={formatINR(t.bySection.ghar.expense)} />
          </div>
        </>
      )}
      <Card title={tr("ઝડપી ઉમેરો")}>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {QUICK.map((q) => <Button key={q.k} size="lg" variant={q.k === "income" ? "default" : "outline"} className="min-h-14 h-auto whitespace-normal py-3 text-base" onClick={() => open({ kind: q.k })}>{tr(q.l)}</Button>)}
        </div>
      </Card>
      <Card title={tr("તાજેતરના વ્યવહારો")}>
        {recent.isLoading ? <Loading /> : <TxnList entries={recent.data ?? []} accounts={accounts} onEdit={open} />}
      </Card>
    </div>
  );
}
