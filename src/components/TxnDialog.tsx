import { tr } from "@/lib/i18n";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KINDS, SECTION_LABEL, SUBTYPE_LABEL, type Kind, type Section } from "@/lib/accounting";
import { errMsg, todayISO, useAccounts, useRecord, type Entry } from "@/lib/data";

export interface TxnPreset { kind: Kind; section?: Section; edit?: Entry }

const selectCls = "h-12 w-full rounded-xl border border-input bg-card px-3 text-base";

export function TxnDialog({ preset, onClose }: { preset: TxnPreset | null; onClose: () => void }) {
  const { data: accounts = [] } = useAccounts();
  const record = useRecord();
  const [kind, setKind] = useState<Kind>("expense");
  const [section, setSection] = useState<Section>("personal");
  const [date, setDate] = useState(todayISO());
  const [amount, setAmount] = useState("");
  const [extra, setExtra] = useState("");
  const [debit, setDebit] = useState("");
  const [credit, setCredit] = useState("");
  const [extraAcc, setExtraAcc] = useState("");
  const [desc, setDesc] = useState("");
  const [party, setParty] = useState("");
  const [key, setKey] = useState(() => crypto.randomUUID());
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!preset) return;
    const e = preset.edit;
    setKind(preset.kind); setSection(e?.section ?? preset.section ?? "personal");
    setDate(e?.entry_date ?? todayISO()); setDesc(e?.description ?? ""); setParty(e?.party ?? "");
    setKey(crypto.randomUUID()); setErr(null);
    if (e) {
      const lines = e.journal_lines;
      const d = lines.find((l) => Number(l.debit) > 0); const c = lines.find((l) => Number(l.credit) > 0);
      const base = Number(d?.debit ?? e.amount);
      setDebit(d?.account_id ?? ""); setCredit(c?.account_id ?? ""); setAmount(String(base));
      const ex = Number(e.amount) - base; setExtra(ex > 0 ? String(ex) : "");
      const exLine = lines.find((l) => l.account_id !== d?.account_id && l.account_id !== c?.account_id);
      setExtraAcc(exLine?.account_id ?? "");
    } else { setAmount(""); setExtra(""); setDebit(""); setCredit(""); setExtraAcc(""); }
  }, [preset]);

  const def = KINDS[kind];
  const active = accounts.filter((a) => !a.is_archived);
  const pick = (subs: string[], sectionAware: boolean) =>
    active.filter((a) => subs.includes(a.subtype))
      .sort((a, b) => (sectionAware ? Number(b.section === section) - Number(a.section === section) : 0));
  const drOpts = useMemo(() => pick(def.dr, true), [def, active, section]);
  const crOpts = useMemo(() => pick(def.cr, true), [def, active, section]);
  const exOpts = def.extra ? pick([def.extra.subtype], true) : [];

  useEffect(() => {
    if (preset?.edit) return;
    if (!drOpts.find((a) => a.id === debit)) setDebit(drOpts[0]?.id ?? "");
    if (!crOpts.find((a) => a.id === credit)) setCredit(crOpts[0]?.id ?? "");
    if (def.extra && !exOpts.find((a) => a.id === extraAcc)) {
      const pref = exOpts.find((a) => a.name.includes(tr("વ્યાજ"))) ?? exOpts[0];
      setExtraAcc(pref?.id ?? "");
    }
  }, [kind, section, accounts.length]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(null);
    const amt = Number(amount); const ex = Number(extra || 0);
    if (!(amt > 0)) return setErr(tr("માન્ય રકમ દાખલ કરો"));
    if (ex < 0) return setErr(tr("વ્યાજ ઋણ ન હોઈ શકે"));
    if (!debit || !credit) return setErr(tr("બંને ખાતા પસંદ કરો"));
    if (debit === credit) return setErr(tr("બંને ખાતા અલગ હોવા જોઈએ"));
    if (ex > 0 && !extraAcc) return setErr(tr("વ્યાજ ખાતું પસંદ કરો"));
    try {
      await record.mutateAsync({
        input: { kind, date, amount: amt, debit, credit, description: desc, party, section, key, extra: ex, extraAccount: ex > 0 ? extraAcc : null },
        replaces: preset?.edit?.id,
      });
      toast.success(preset?.edit ? tr("વ્યવહાર સુધાર્યો") : tr("વ્યવહાર સાચવ્યો"));
      onClose();
    } catch (e2) { setErr(errMsg(e2)); }
  };

  const opt = (a: (typeof accounts)[number]) => (
    <option key={a.id} value={a.id}>{tr(a.name)} · {tr(SUBTYPE_LABEL[a.subtype])}{a.section !== "personal" ? ` · ${tr(SECTION_LABEL[a.section])}` : ""}</option>
  );

  return (
    <Dialog open={!!preset} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader><DialogTitle className="text-2xl">{preset?.edit ? tr("વ્યવહાર સુધારો") : tr("નવો વ્યવહાર")}</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>{tr("પ્રકાર")}</Label>
              <select className={selectCls} value={kind} disabled={!!preset?.edit} onChange={(e) => setKind(e.target.value as Kind)}>
                {(Object.keys(KINDS) as Kind[]).map((k) => <option key={k} value={k}>{tr(KINDS[k].label)}</option>)}
              </select></div>
            <div className="space-y-1.5"><Label>{tr("વિભાગ")}</Label>
              <select className={selectCls} value={section} onChange={(e) => setSection(e.target.value as Section)}>
                {(Object.keys(SECTION_LABEL) as Section[]).map((s) => <option key={s} value={s}>{tr(SECTION_LABEL[s])}</option>)}
              </select></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>{tr("રકમ (₹)")}</Label>
              <Input className="h-12 text-lg" inputMode="decimal" type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus /></div>
            <div className="space-y-1.5"><Label>{tr("તારીખ")}</Label>
              <Input className="h-12" type="date" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} /></div>
          </div>
          <div className="space-y-1.5"><Label>{tr(def.debitLabel)}</Label>
            <select className={selectCls} value={debit} onChange={(e) => setDebit(e.target.value)}>
              {drOpts.length === 0 && <option value="">{tr("— પહેલા ખાતું બનાવો —")}</option>}{drOpts.map(opt)}</select></div>
          <div className="space-y-1.5"><Label>{tr(def.creditLabel)}</Label>
            <select className={selectCls} value={credit} onChange={(e) => setCredit(e.target.value)}>
              {crOpts.length === 0 && <option value="">{tr("— પહેલા ખાતું બનાવો —")}</option>}{crOpts.map(opt)}</select></div>
          {def.extra && (
            <div className="grid grid-cols-2 gap-3 rounded-xl bg-muted p-3">
              <div className="space-y-1.5"><Label>{tr(def.extra.label)} (₹)</Label>
                <Input className="h-12" type="number" step="0.01" min="0" value={extra} onChange={(e) => setExtra(e.target.value)} /></div>
              <div className="space-y-1.5"><Label>{tr("ખાતું")}</Label>
                <select className={selectCls} value={extraAcc} onChange={(e) => setExtraAcc(e.target.value)}>{exOpts.map(opt)}</select></div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>{tr("વ્યક્તિ / પક્ષ")}</Label><Input className="h-12" maxLength={80} value={party} onChange={(e) => setParty(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>{tr("નોંધ")}</Label><Input className="h-12" maxLength={200} value={desc} onChange={(e) => setDesc(e.target.value)} /></div>
          </div>
          {err && <p className="rounded-lg bg-destructive/10 p-2 text-sm text-destructive">{err}</p>}
          <Button type="submit" size="lg" className="h-13 w-full text-lg" disabled={record.isPending}>
            {record.isPending ? tr("સાચવી રહ્યા છીએ…") : tr("સાચવો")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
