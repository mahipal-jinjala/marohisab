import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { computeTotals, type Account, type Kind, type Section, type SummaryRow } from "./accounting";

export interface Entry {
  id: string; entry_date: string; kind: Kind; section: Section; description: string | null;
  party: string | null; amount: number; reversal_of: string | null; reversed_by: string | null; created_at: string;
  journal_lines: { account_id: string; debit: number; credit: number }[];
}

export const todayISO = () => new Date().toLocaleDateString("en-CA");
export const monthStartISO = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1).toLocaleDateString("en-CA"); };

export function useAccounts() {
  return useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      await supabase.rpc("ensure_default_accounts");
      const { data, error } = await supabase.from("accounts").select("*").order("name");
      if (error) throw error;
      return data as unknown as Account[];
    },
  });
}

export function useSummary(from: string, to: string) {
  return useQuery({
    queryKey: ["summary", from, to],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("account_summary", { p_from: from, p_to: to });
      if (error) throw error;
      return data as unknown as SummaryRow[];
    },
  });
}

export function useTotals(from: string, to: string) {
  const a = useAccounts();
  const s = useSummary(from, to);
  const totals = a.data && s.data ? computeTotals(a.data, s.data) : null;
  return { accounts: a.data ?? [], totals, isLoading: a.isLoading || s.isLoading, error: a.error || s.error };
}

export function useEntries(opts: { from?: string; to?: string; section?: Section | undefined; limit?: number } = {}) {
  return useQuery({
    queryKey: ["entries", opts],
    queryFn: async () => {
      let q = supabase.from("journal_entries")
        .select("*, journal_lines(account_id, debit, credit)")
        .order("entry_date", { ascending: false }).order("created_at", { ascending: false })
        .limit(opts.limit ?? 500);
      if (opts.from) q = q.gte("entry_date", opts.from);
      if (opts.to) q = q.lte("entry_date", opts.to);
      if (opts.section) q = q.eq("section", opts.section);
      const { data, error } = await q;
      if (error) throw error;
      return data as unknown as Entry[];
    },
  });
}

export interface TxnInput {
  kind: Kind; date: string; amount: number; debit: string; credit: string;
  description?: string; party?: string; section: Section; key: string; extra?: number; extraAccount?: string | null;
}

export function useInvalidate() {
  const qc = useQueryClient();
  return () => { qc.invalidateQueries({ queryKey: ["summary"] }); qc.invalidateQueries({ queryKey: ["entries"] }); qc.invalidateQueries({ queryKey: ["accounts"] }); };
}

export function useRecord() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async ({ input, replaces }: { input: TxnInput; replaces?: string | undefined }) => {
      const args = {
        p_kind: input.kind, p_date: input.date, p_amount: input.amount, p_debit: input.debit, p_credit: input.credit,
        ...(input.description ? { p_description: input.description } : {}), ...(input.party ? { p_party: input.party } : {}), p_section: input.section,
        p_idempotency_key: input.key, p_extra_amount: input.extra ?? 0, ...(input.extraAccount ? { p_extra_account: input.extraAccount } : {}),
      };
      // Edit = reverse original + repost, atomically in one DB transaction (no double-counting on partial failure).
      const { data, error } = replaces
        ? await supabase.rpc("edit_transaction", { p_entry: replaces, ...args })
        : await supabase.rpc("record_transaction", args);
      if (error) throw error;
      return data;
    },
    onSuccess: inv,
  });
}

export function useReverse() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc("reverse_transaction", { p_entry: id, p_reason: "delete" });
      if (error) throw error;
    },
    onSuccess: inv,
  });
}

export function useCreateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (a: Pick<Account, "name" | "subtype" | "section"> & { party?: string; interest_rate?: number | null }) => {
      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase.from("accounts").insert({
        name: a.name.trim(), subtype: a.subtype, section: a.section, type: "asset",
        party: a.party || null, interest_rate: a.interest_rate ?? null, user_id: u.user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["accounts"] }),
  });
}

export function useUpdateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: { id: string; name?: string; is_archived?: boolean }) => {
      const { error } = await supabase.from("accounts").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["accounts"] }),
  });
}

export function errMsg(e: unknown) {
  const m = (e as { message?: string })?.message ?? "ભૂલ આવી";
  if (m.includes("duplicate key") || m.includes("unique")) return "આ નામનું ખાતું પહેલેથી છે";
  return m;
}
