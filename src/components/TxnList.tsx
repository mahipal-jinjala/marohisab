import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Undo2 } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { KINDS, SECTION_LABEL, formatINR, type Account } from "@/lib/accounting";
import { errMsg, useReverse, type Entry } from "@/lib/data";
import type { TxnPreset } from "./TxnDialog";

const inflow = new Set(["income", "loan_taken", "lend_collect", "invest_redeem", "asset_sell", "opening_asset"]);

export function TxnList({ entries, accounts, onEdit, empty = "હજી કોઈ વ્યવહાર નથી" }:
  { entries: Entry[]; accounts: Account[]; onEdit?: (p: TxnPreset) => void; empty?: string }) {
  const reverse = useReverse();
  const [target, setTarget] = useState<Entry | null>(null);
  const name = (id?: string) => accounts.find((a) => a.id === id)?.name ?? "";
  if (!entries.length) return <p className="py-10 text-center text-muted-foreground">{empty}</p>;
  return (
    <>
      <ul className="divide-y divide-border">
        {entries.map((e) => {
          const dr = e.journal_lines.find((l) => Number(l.debit) > 0)?.account_id;
          const cr = e.journal_lines.find((l) => Number(l.credit) > 0)?.account_id;
          const dead = !!e.reversed_by || !!e.reversal_of;
          return (
            <li key={e.id} className={`flex items-center gap-3 py-3 ${dead ? "opacity-50" : ""}`}>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{e.description || KINDS[e.kind]?.label || e.kind}{e.party ? ` · ${e.party}` : ""}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {new Date(e.entry_date).toLocaleDateString("gu-IN")} · {KINDS[e.kind]?.label} · {SECTION_LABEL[e.section]} · {name(dr)} ← {name(cr)}
                  {e.reversed_by ? " · રદ થયેલ" : ""}{e.reversal_of ? " · રદ એન્ટ્રી" : ""}
                </p>
              </div>
              <span className={`shrink-0 font-bold tabular-nums ${dead ? "line-through" : inflow.has(e.kind) ? "text-success" : "text-foreground"}`}>
                {formatINR(Number(e.amount))}
              </span>
              {!dead && (
                <div className="flex shrink-0">
                  {onEdit && <Button size="icon" variant="ghost" aria-label="સુધારો" onClick={() => onEdit({ kind: e.kind, edit: e })}><Pencil className="size-4" /></Button>}
                  <Button size="icon" variant="ghost" aria-label="રદ કરો" onClick={() => setTarget(e)}><Undo2 className="size-4" /></Button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <AlertDialog open={!!target} onOpenChange={(o) => !o && setTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>વ્યવહાર રદ કરવો છે?</AlertDialogTitle>
            <AlertDialogDescription>ખાતાવહીમાં ઉલટી એન્ટ્રી ઉમેરાશે. મૂળ રેકોર્ડ ઓડિટ માટે રહેશે.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ના</AlertDialogCancel>
            <AlertDialogAction onClick={async () => {
              try { await reverse.mutateAsync(target!.id); toast.success("વ્યવહાર રદ થયો"); } catch (e) { toast.error(errMsg(e)); }
              setTarget(null);
            }}>હા, રદ કરો</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
