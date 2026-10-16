import { tr } from "@/lib/i18n";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, DateRange, Loading, PageHeader, Stat } from "@/components/AppShell";
import { SECTION_LABEL, SUBTYPE_LABEL, downloadCSV, formatINR, type Section } from "@/lib/accounting";
import { monthStartISO, todayISO, useEntries, useTotals } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({ meta: [{ title: tr("રિપોર્ટ — મારો હિસાબ") }, { name: "description", content: tr("દૈનિક, માસિક, વાર્ષિક રિપોર્ટ, બેલેન્સ શીટ અને નેટ વર્થ.") }] }),
  component: Reports,
});

type Group = "day" | "month" | "year";

function Reports() {
  const [from, setFrom] = useState(monthStartISO());
  const [to, setTo] = useState(todayISO());
  const [group, setGroup] = useState<Group>("day");
  const { accounts, totals: t, isLoading } = useTotals(from, to);
  const entries = useEntries({ from, to, limit: 5000 });
  const typeOf = useMemo(() => new Map(accounts.map((a) => [a.id, a.type])), [accounts]);

  const periods = useMemo(() => {
    const m = new Map<string, { inc: number; exp: number }>();
    for (const e of entries.data ?? []) {
      if (e.reversed_by || e.reversal_of) continue;
      const k = group === "day" ? e.entry_date : group === "month" ? e.entry_date.slice(0, 7) : e.entry_date.slice(0, 4);
      const r = m.get(k) ?? { inc: 0, exp: 0 };
      for (const l of e.journal_lines) {
        const ty = typeOf.get(l.account_id);
        if (ty === "income") r.inc += Number(l.credit) - Number(l.debit);
        if (ty === "expense") r.exp += Number(l.debit) - Number(l.credit);
      }
      m.set(k, r);
    }
    return [...m.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [entries.data, group, typeOf]);

  if (isLoading || !t) return <><PageHeader title={tr("રિપોર્ટ")} /><Loading /></>;
  const bal = (id: string) => t.balances.get(id)!;
  const live = accounts.filter((a) => Math.abs(bal(a.id).closing) > 0.004 || Math.abs(bal(a.id).period) > 0.004);

  const exportAll = () => downloadCSV(`report-${from}-${to}.csv`, [
    [tr("મારો હિસાબ રિપોર્ટ"), `${from} – ${to}`], [],
    [tr("સારાંશ"), tr("રકમ")],
    [tr("આવક"), t.income], [tr("ખર્ચ"), t.expense], [tr("ખર્ચ પછીની કમાણી"), t.earnings],
    [tr("રોકડ"), t.cash], [tr("બેંક"), t.bank], ["UPI", t.upi], [tr("બાકી લોન"), t.loans], [tr("બાકી વ્યક્તિગત લોન"), t.personalLoans],
    [tr("લોન બાદ કમાણી"), t.earningsAfterLoans], [tr("લેણું"), t.receivables], [tr("રોકાણ"), t.investments],
    [tr("કુલ મિલકત"), t.assets], [tr("કુલ દેવું"), t.liabilities], [tr("નેટ વર્થ"), t.netWorth], [],
    [tr("વિભાગ"), tr("આવક"), tr("ખર્ચ"), tr("નફો/નુકસાન")],
    ...(Object.keys(SECTION_LABEL) as Section[]).map((s) => [tr(SECTION_LABEL[s]), t.bySection[s].income, t.bySection[s].expense, t.bySection[s].profit]), [],
    [tr("સમયગાળો"), tr("આવક"), tr("ખર્ચ"), tr("ચોખ્ખું")], ...periods.map(([k, v]) => [k, v.inc, v.exp, v.inc - v.exp]), [],
    [tr("ખાતું"), tr("પ્રકાર"), tr("વિભાગ"), tr("સમયગાળાનો ફેરફાર"), tr("અંતિમ બેલેન્સ")],
    ...live.map((a) => [tr(a.name), tr(SUBTYPE_LABEL[a.subtype]), tr(SECTION_LABEL[a.section]), bal(a.id).period, bal(a.id).closing]),
  ]);

  const row = (l: string, v: number, strong = false) => (
    <div className={`flex justify-between py-1.5 ${strong ? "border-t font-bold" : ""}`}><span>{l}</span><span className="tabular-nums">{formatINR(v)}</span></div>
  );

  return (
    <div className="space-y-4">
      <PageHeader title={tr("રિપોર્ટ")}><Button onClick={exportAll}><Download className="size-4" /> CSV / Excel</Button></PageHeader>
      <DateRange from={from} to={to} onChange={(f, x) => { setFrom(f); setTo(x); }} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat tone="good" label={tr("આવક")} value={formatINR(t.income)} />
        <Stat tone="bad" label={tr("ખર્ચ")} value={formatINR(t.expense)} />
        <Stat label={tr("ચોખ્ખી કમાણી")} value={formatINR(t.earnings)} />
        <Stat tone="hero" label={tr("નેટ વર્થ")} value={formatINR(t.netWorth)} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title={tr("બેલેન્સ શીટ")}>
          {row(tr("રોકડ"), t.cash)}{row(tr("બેંક"), t.bank)}{row("UPI", t.upi)}{row(tr("લેણું"), t.receivables)}{row(tr("રોકાણ"), t.investments)}{row(tr("મિલકત"), t.fixedAssets)}
          {row(tr("કુલ મિલકત"), t.assets, true)}{row(tr("કુલ દેવું (લોન સહિત)"), t.liabilities)}{row(tr("નેટ વર્થ"), t.netWorth, true)}
        </Card>
        <Card title={tr("વિભાગ મુજબ નફો / ખર્ચ")}>
          {(Object.keys(SECTION_LABEL) as Section[]).map((s) => (
            <div key={s} className="flex justify-between border-b py-2 last:border-0">
              <span>{tr(SECTION_LABEL[s])}</span>
              <span className="text-right text-sm tabular-nums">{tr("આવક")} {formatINR(t.bySection[s].income)} · {tr("ખર્ચ")} {formatINR(t.bySection[s].expense)}<br />
                <b className={t.bySection[s].profit >= 0 ? "text-success" : "text-destructive"}>{formatINR(t.bySection[s].profit)}</b></span>
            </div>
          ))}
        </Card>
      </div>
      <Card title={tr("આવક વિ. ખર્ચ")} action={
        <div className="flex gap-1">{(["day", "month", "year"] as Group[]).map((g) => (
          <Button key={g} size="sm" variant={group === g ? "default" : "outline"} onClick={() => setGroup(g)}>{g === "day" ? tr("દૈનિક") : g === "month" ? tr("માસિક") : tr("વાર્ષિક")}</Button>))}</div>}>
        {entries.isLoading ? <Loading /> : periods.length === 0 ? <p className="py-6 text-center text-muted-foreground">{tr("આ સમયગાળામાં ડેટા નથી")}</p> : (
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead><tr className="text-left text-muted-foreground"><th className="py-2tr(">{tr("સમયગાળો")}</th><th className=")text-righttr(">{tr("આવક")}</th><th className=")text-righttr(">{tr("ખર્ચ")}</th><th className=")text-right">{tr("ચોખ્ખું")}</th></tr></thead>
            <tbody>{periods.map(([k, v]) => (
              <tr key={k} className="border-t"><td className="py-2">{k}</td><td className="text-right text-success">{formatINR(v.inc)}</td><td className="text-right">{formatINR(v.exp)}</td>
                <td className={`text-right font-semibold ${v.inc - v.exp >= 0 ? "text-success" : "text-destructive"}`}>{formatINR(v.inc - v.exp)}</td></tr>))}</tbody>
          </table></div>
        )}
      </Card>
      <Card title={tr("ખાતા મુજબ (જનરલ લેજર સારાંશ)")}>
        <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead><tr className="text-left text-muted-foreground"><th className="py-2tr(">{tr("ખાતું")}</th><th>{tr("પ્રકાર")}</th><th className=")text-righttr(">{tr("સમયગાળો")}</th><th className=")text-right">{tr("બેલેન્સ")}</th></tr></thead>
          <tbody>{live.map((a) => (
            <tr key={a.id} className="border-t"><td className="py-2">{tr(a.name)}</td><td className="text-muted-foreground">{tr(SUBTYPE_LABEL[a.subtype])} · {tr(SECTION_LABEL[a.section])}</td>
              <td className="text-right tabular-nums">{formatINR(bal(a.id).period)}</td><td className="text-right font-semibold tabular-nums">{formatINR(bal(a.id).closing)}</td></tr>))}</tbody>
        </table></div>
      </Card>
    </div>
  );
}
