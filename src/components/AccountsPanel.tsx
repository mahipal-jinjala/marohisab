import { tr } from "@/lib/i18n";
import { useState } from "react";
import { toast } from "sonner";
import { Archive, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { SECTION_LABEL, SUBTYPE_LABEL, formatINR, type Account, type Section, type Subtype, type Totals } from "@/lib/accounting";
import { errMsg, useCreateAccount, useUpdateAccount } from "@/lib/data";

export function AccountTable({ accounts, totals, period = false }: { accounts: Account[]; totals: Totals | null; period?: boolean | undefined }) {
  const upd = useUpdateAccount();
  if (!accounts.length) return <p className="py-6 text-center text-muted-foreground">{tr("કોઈ ખાતું નથી")}</p>;
  return (
    <ul className="divide-y">
      {accounts.map((a) => {
        const b = totals?.balances.get(a.id);
        const v = period ? b?.period ?? 0 : b?.closing ?? 0;
        return (
          <li key={a.id} className="flex items-center gap-3 py-2.5">
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{tr(a.name)}{a.party ? ` · ${a.party}` : ""}</p>
              <p className="text-xs text-muted-foreground">{tr(SUBTYPE_LABEL[a.subtype])} · {tr(SECTION_LABEL[a.section])}{a.interest_rate ? ` · ${a.interest_rate}% ${tr("વ્યાજ")}` : ""}</p>
            </div>
            <span className="font-bold tabular-nums">{formatINR(v)}</span>
            {Math.abs(b?.closing ?? 0) < 0.005 && (
              <Button size="icon" variant="ghost" aria-label={tr("આર્કાઇવ")} onClick={async () => {
                if (!confirm(`"${tr(a.name)}" — ${tr("છુપાવવું છે?")}`)) return;
                try { await upd.mutateAsync({ id: a.id, is_archived: true }); toast.success(tr("ખાતું છુપાવ્યું")); } catch (e) { toast.error(errMsg(e)); }
              }}><Archive className="size-4" /></Button>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function NewAccountButton({ subtypes, section = "personal", label = tr("નવું ખાતું"), withParty = false }:
  { subtypes: Subtype[]; section?: Section; label?: string; withParty?: boolean }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [subtype, setSubtype] = useState<Subtype>(subtypes[0] ?? "cash");
  const [sec, setSec] = useState<Section>(section);
  const [party, setParty] = useState("");
  const [rate, setRate] = useState("");
  const create = useCreateAccount();
  const sel = "h-12 w-full rounded-xl border bg-card px-3";
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error(tr("નામ દાખલ કરો")); return; }
    try {
      await create.mutateAsync({ name, subtype, section: sec, party, interest_rate: rate ? Number(rate) : null });
      toast.success(tr("ખાતું બન્યું")); setOpen(false); setName(""); setParty(""); setRate("");
    } catch (e2) { toast.error(errMsg(e2)); }
  };
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}><Plus className="size-4" />{label}</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto">
          <DialogHeader><DialogTitle>{label}</DialogTitle></DialogHeader>
          <form onSubmit={save} className="space-y-3">
            <div className="space-y-1.5"><Label>{tr("નામ")}</Label><Input className="h-12" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} autoFocus /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>{tr("પ્રકાર")}</Label>
                <select className={sel} value={subtype} onChange={(e) => setSubtype(e.target.value as Subtype)}>
                  {subtypes.map((s) => <option key={s} value={s}>{tr(SUBTYPE_LABEL[s])}</option>)}</select></div>
              <div className="space-y-1.5"><Label>{tr("વિભાગ")}</Label>
                <select className={sel} value={sec} onChange={(e) => setSec(e.target.value as Section)}>
                  {(Object.keys(SECTION_LABEL) as Section[]).map((s) => <option key={s} value={s}>{tr(SECTION_LABEL[s])}</option>)}</select></div>
            </div>
            {withParty && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>{tr("વ્યક્તિ / બેંક")}</Label><Input className="h-12" value={party} onChange={(e) => setParty(e.target.value)} /></div>
                <div className="space-y-1.5"><Label>{tr("વ્યાજ દર (%)")}</Label><Input className="h-12" type="number" step="0.01" min="0" value={rate} onChange={(e) => setRate(e.target.value)} /></div>
              </div>
            )}
            <Button type="submit" size="lg" className="h-12 w-full" disabled={create.isPending}>{tr("સાચવો")}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
