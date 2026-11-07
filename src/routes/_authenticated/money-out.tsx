import { tr, translatedError } from "@/lib/i18n";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, DateRange, Loading, PageHeader, Stat } from "@/components/AppShell";
import { SECTION_LABEL, formatINR, spendingByCategory } from "@/lib/accounting";
import { monthStartISO, todayISO, useTotals } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/money-out")({
  head: () => ({ meta: [{ title: tr("પૈસા ક્યાં ગયા — મારો હિસાબ") }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }, { name: "description", content: tr("કઈ કેટેગરીમાં કેટલા પૈસા વપરાયા — સરળ દેખાવ.") }, { property: "og:title", content: tr("પૈસા ક્યાં ગયા — મારો હિસાબ") }, { property: "og:description", content: tr("કઈ કેટેગરીમાં કેટલા પૈસા વપરાયા — સરળ દેખાવ.") }] }),
  component: MoneyOut,
});

function MoneyOut() {
  const [from, setFrom] = useState(monthStartISO());
  const [to, setTo] = useState(todayISO());
  const { accounts, totals: t, isLoading, error } = useTotals(from, to);
  if (error) return <p className="text-destructive">{tr("ડેટા લોડ ન થયો:")} {translatedError(error)}</p>;
  const rows = t ? spendingByCategory(accounts, t) : [];
  return (
    <div className="space-y-4">
      <PageHeader title={tr("પૈસા ક્યાં ગયા")}><DateRange from={from} to={to} onChange={(f, x) => { setFrom(f); setTo(x); }} /></PageHeader>
      {isLoading || !t ? <Loading /> : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat tone="good" label={tr("કુલ આવક")} value={formatINR(t.income)} />
            <Stat tone="bad" label={tr("કુલ ખર્ચ")} value={formatINR(t.expense)} />
            <Stat tone={t.earnings >= 0 ? "hero" : "bad"} label={tr("બચત / કમાણી")} value={formatINR(t.earnings)} />
          </div>
          <Card title={tr("કઈ કેટેગરીમાં કેટલા વપરાયા")}>
            {rows.length === 0 ? <p className="py-6 text-center text-muted-foreground">{tr("આ સમયગાળામાં કોઈ ખર્ચ નથી")}</p> : (
              <ul className="space-y-3">
                {rows.map((r) => (
                  <li key={r.account.id}>
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="min-w-0 truncate font-medium">{tr(r.account.name)}</span>
                      <span className="shrink-0 font-bold tabular-nums">{formatINR(r.amount)} <span className="text-xs font-normal text-muted-foreground">({Math.round(r.share * 100)}%)</span></span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-accent" style={{ width: `${Math.max(2, Math.round(r.share * 100))}%` }} />
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{tr(SECTION_LABEL[r.account.section])}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card title={tr("હવે પાસે કેટલા પૈસા છે")}>
            <div className="grid gap-3 sm:grid-cols-3">
              <Stat label={tr("રોકડ")} value={formatINR(t.cash)} />
              <Stat label={tr("બેંક")} value={formatINR(t.bank)} />
              <Stat label="UPI" value={formatINR(t.upi)} />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{tr("ટ્રાન્સફર, લોન ચૂકવણી અને રોકાણ ખર્ચમાં ગણાતા નથી — અહીં ફક્ત સાચો ખર્ચ બતાવ્યો છે.")}</p>
          </Card>
        </>
      )}
    </div>
  );
}
