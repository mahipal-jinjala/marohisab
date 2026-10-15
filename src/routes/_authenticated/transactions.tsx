import { tr } from "@/lib/i18n";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, DateRange, Loading, PageHeader, useOpenTxn } from "@/components/AppShell";
import { TxnList } from "@/components/TxnList";
import { KINDS, SECTION_LABEL, downloadCSV, type Kind, type Section } from "@/lib/accounting";
import { monthStartISO, todayISO, useAccounts, useEntries } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/transactions")({
  head: () => ({ meta: [{ title: tr("વ્યવહારો — મારો હિસાબ") }, { name: "description", content: tr("બધા વ્યવહારો શોધો અને ફિલ્ટર કરો.") }] }),
  component: Txns,
});

function Txns() {
  const [from, setFrom] = useState(monthStartISO());
  const [to, setTo] = useState(todayISO());
  const [q, setQ] = useState("");
  const [kind, setKind] = useState<Kind | "">("");
  const [section, setSection] = useState<Section | "">("");
  const open = useOpenTxn();
  const { data: accounts = [] } = useAccounts();
  const { data = [], isLoading } = useEntries({ from, to, section: section || undefined, limit: 1000 });
  const list = useMemo(() => data.filter((e) =>
    (!kind || e.kind === kind) &&
    (!q || `${e.description ?? ""} ${e.party ?? ""} ${e.amount}`.toLowerCase().includes(q.toLowerCase()))), [data, kind, q]);
  const name = (id?: string) => tr(accounts.find((a) => a.id === id)?.name ?? "");
  const exportCsv = () => downloadCSV(`vyavhar-${from}-${to}.csv`, [
    [tr("તારીખ"), tr("પ્રકાર"), tr("વિભાગ"), tr("નોંધ"), tr("પક્ષ"), tr("ઉધાર (Dr)"), tr("જમા (Cr)"), tr("રકમ"), tr("સ્થિતિ")],
    ...list.map((e) => [e.entry_date, tr(KINDS[e.kind]?.label) ?? e.kind, tr(SECTION_LABEL[e.section]), tr(e.description ?? ""), e.party ?? "",
      name(e.journal_lines.find((l) => Number(l.debit) > 0)?.account_id), name(e.journal_lines.find((l) => Number(l.credit) > 0)?.account_id),
      Number(e.amount), e.reversed_by ? tr("રદ") : e.reversal_of ? tr("રદ એન્ટ્રી") : tr("સક્રિય")]),
  ]);
  const sel = "h-10 rounded-lg border bg-card px-2 text-sm";
  return (
    <div className="space-y-4">
      <PageHeader title={tr("વ્યવહારો")}>
        <Button variant="outline" onClick={exportCsv}><Download className="size-4" /> CSV / Excel</Button>
        <Button onClick={() => open({ kind: "expense" })}>{tr("+ નવો વ્યવહાર")}</Button>
      </PageHeader>
      <Card>
        <div className="mb-3 flex flex-col gap-2">
          <DateRange from={from} to={to} onChange={(f, x) => { setFrom(f); setTo(x); }} />
          <div className="flex flex-wrap gap-2">
            <Input className="h-10 max-w-xs" placeholder={tr("શોધો…")} value={q} onChange={(e) => setQ(e.target.value)} />
            <select className={sel} value={kind} onChange={(e) => setKind(e.target.value as Kind)}>
              <option value="">{tr("બધા પ્રકાર")}</option>{(Object.keys(KINDS) as Kind[]).map((k) => <option key={k} value={k}>{tr(KINDS[k].label)}</option>)}
            </select>
            <select className={sel} value={section} onChange={(e) => setSection(e.target.value as Section)}>
              <option value="">{tr("બધા વિભાગ")}</option>{(Object.keys(SECTION_LABEL) as Section[]).map((s) => <option key={s} value={s}>{tr(SECTION_LABEL[s])}</option>)}
            </select>
          </div>
        </div>
        {isLoading ? <Loading /> : <TxnList entries={list} accounts={accounts} onEdit={open} empty={tr("આ ફિલ્ટરમાં કોઈ વ્યવહાર નથી")} />}
      </Card>
    </div>
  );
}
