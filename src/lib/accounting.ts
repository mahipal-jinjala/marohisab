// Gujarati accounting rules — mirror of the database `kind_rule` function.
export type Subtype =
  | "cash" | "bank" | "upi" | "receivable" | "investment" | "fixed_asset"
  | "loan_payable" | "other_liability" | "equity" | "income" | "expense";
export type AccType = "asset" | "liability" | "equity" | "income" | "expense";
export type Section = "personal" | "household" | "ghar" | "dairy" | "business";

export interface Account {
  id: string; name: string; type: AccType; subtype: Subtype; section: Section;
  party: string | null; interest_rate: number | null; is_archived: boolean;
}
export interface SummaryRow {
  account_id: string; period_debit: number; period_credit: number;
  closing_debit: number; closing_credit: number;
}

const MONEY: Subtype[] = ["cash", "bank", "upi"];
const LIAB: Subtype[] = ["loan_payable", "other_liability"];

export type Kind =
  | "income" | "expense" | "transfer" | "loan_taken" | "loan_repay" | "lend" | "lend_collect"
  | "invest" | "invest_redeem" | "asset_buy" | "asset_sell" | "opening_asset" | "opening_liability";

export interface KindDef {
  label: string; debitLabel: string; creditLabel: string;
  dr: Subtype[]; cr: Subtype[];
  extra?: { label: string; subtype: Subtype };
}

export const KINDS: Record<Kind, KindDef> = {
  income: { label: "આવક", debitLabel: "ક્યાં જમા થયા", creditLabel: "આવકનો પ્રકાર", dr: MONEY, cr: ["income"] },
  expense: { label: "ખર્ચ", debitLabel: "ખર્ચનો પ્રકાર", creditLabel: "ક્યાંથી ચૂકવ્યા", dr: ["expense"], cr: [...MONEY, ...LIAB] },
  transfer: { label: "ટ્રાન્સફર", debitLabel: "ક્યાં", creditLabel: "ક્યાંથી", dr: MONEY, cr: MONEY },
  loan_taken: { label: "લોન / ઉધાર લીધા", debitLabel: "ક્યાં જમા થયા", creditLabel: "લોન ખાતું", dr: MONEY, cr: LIAB },
  loan_repay: { label: "લોન ચૂકવણી", debitLabel: "લોન ખાતું", creditLabel: "ક્યાંથી ચૂકવ્યા", dr: LIAB, cr: MONEY, extra: { label: "વ્યાજ ચૂકવ્યું", subtype: "expense" } },
  lend: { label: "ઉધાર આપ્યા", debitLabel: "કોને (લેણું ખાતું)", creditLabel: "ક્યાંથી આપ્યા", dr: ["receivable"], cr: MONEY },
  lend_collect: { label: "ઉધાર પાછા મળ્યા", debitLabel: "ક્યાં જમા થયા", creditLabel: "લેણું ખાતું", dr: MONEY, cr: ["receivable"], extra: { label: "વ્યાજ મળ્યું", subtype: "income" } },
  invest: { label: "રોકાણ", debitLabel: "રોકાણ ખાતું", creditLabel: "ક્યાંથી", dr: ["investment"], cr: MONEY },
  invest_redeem: { label: "રોકાણ ઉપાડ", debitLabel: "ક્યાં જમા થયા", creditLabel: "રોકાણ ખાતું", dr: MONEY, cr: ["investment"], extra: { label: "નફો / વ્યાજ", subtype: "income" } },
  asset_buy: { label: "મિલકત ખરીદી", debitLabel: "મિલકત", creditLabel: "ક્યાંથી ચૂકવ્યા", dr: ["fixed_asset"], cr: [...MONEY, ...LIAB] },
  asset_sell: { label: "મિલકત વેચાણ (મૂળ કિંમતે)", debitLabel: "ક્યાં જમા થયા", creditLabel: "મિલકત", dr: MONEY, cr: ["fixed_asset"] },
  opening_asset: { label: "શરૂઆતનું બેલેન્સ (મિલકત)", debitLabel: "ખાતું", creditLabel: "મૂડી", dr: [...MONEY, "receivable", "investment", "fixed_asset"], cr: ["equity"] },
  opening_liability: { label: "શરૂઆતનું દેવું", debitLabel: "મૂડી", creditLabel: "દેવું ખાતું", dr: ["equity"], cr: LIAB },
};

export const SUBTYPE_LABEL: Record<Subtype, string> = {
  cash: "રોકડ", bank: "બેંક", upi: "UPI", receivable: "લેણું (ઉધાર આપેલ)", investment: "રોકાણ",
  fixed_asset: "મિલકત", loan_payable: "લોન (લીધેલ)", other_liability: "અન્ય દેવું",
  equity: "મૂડી", income: "આવક", expense: "ખર્ચ",
};
export const SECTION_LABEL: Record<Section, string> = {
  personal: "વ્યક્તિગત", household: "ઘરખર્ચ", ghar: "ઘર વેરેન્ટેજ", dairy: "ભેંસ ડેરી", business: "વ્યવસાય",
};

export interface Line { side: "debit" | "credit"; subtype: Subtype; amount: number }

/** Build journal lines for a transaction; throws if the accounts don't fit the kind. */
export function buildLines(kind: Kind, amount: number, dr: Subtype, cr: Subtype, extra = 0, extraSub?: Subtype): Line[] {
  const def = KINDS[kind];
  if (!(amount > 0)) throw new Error("રકમ શૂન્યથી વધુ હોવી જોઈએ");
  if (!def.dr.includes(dr) || !def.cr.includes(cr)) throw new Error("આ વ્યવહાર માટે ખાતાનો પ્રકાર યોગ્ય નથી");
  const lines: Line[] = [
    { side: "debit", subtype: dr, amount },
    { side: "credit", subtype: cr, amount },
  ];
  if (extra > 0) {
    if (!def.extra || extraSub !== def.extra.subtype) throw new Error("વ્યાજ આ વ્યવહારમાં માન્ય નથી");
    if (kind === "loan_repay") lines.push({ side: "debit", subtype: extraSub, amount: extra }, { side: "credit", subtype: cr, amount: extra });
    else lines.push({ side: "debit", subtype: dr, amount: extra }, { side: "credit", subtype: extraSub, amount: extra });
  }
  return lines;
}

export function isBalanced(lines: Line[]) {
  const d = lines.filter((l) => l.side === "debit").reduce((s, l) => s + l.amount, 0);
  const c = lines.filter((l) => l.side === "credit").reduce((s, l) => s + l.amount, 0);
  return Math.abs(d - c) < 0.005;
}

const debitNormal = (t: AccType) => t === "asset" || t === "expense";
export const balanceOf = (t: AccType, dr: number, cr: number) => (debitNormal(t) ? dr - cr : cr - dr);

export interface Totals {
  cash: number; bank: number; upi: number; available: number;
  income: number; expense: number; earnings: number;
  loans: number; personalLoans: number; earningsAfterLoans: number;
  receivables: number; investments: number; fixedAssets: number;
  assets: number; liabilities: number; netWorth: number;
  bySection: Record<Section, { income: number; expense: number; profit: number }>;
  balances: Map<string, { closing: number; period: number }>;
}

export function computeTotals(accounts: Account[], rows: SummaryRow[]): Totals {
  const map = new Map(rows.map((r) => [r.account_id, r]));
  const t: Totals = {
    cash: 0, bank: 0, upi: 0, available: 0, income: 0, expense: 0, earnings: 0, loans: 0, personalLoans: 0,
    earningsAfterLoans: 0, receivables: 0, investments: 0, fixedAssets: 0, assets: 0, liabilities: 0, netWorth: 0,
    bySection: Object.fromEntries((Object.keys(SECTION_LABEL) as Section[]).map((s) => [s, { income: 0, expense: 0, profit: 0 }])) as Totals["bySection"],
    balances: new Map(),
  };
  for (const a of accounts) {
    const r = map.get(a.id);
    const closing = r ? balanceOf(a.type, Number(r.closing_debit), Number(r.closing_credit)) : 0;
    const period = r ? balanceOf(a.type, Number(r.period_debit), Number(r.period_credit)) : 0;
    t.balances.set(a.id, { closing, period });
    if (a.subtype === "cash") t.cash += closing;
    if (a.subtype === "bank") t.bank += closing;
    if (a.subtype === "upi") t.upi += closing;
    if (a.subtype === "receivable") t.receivables += closing;
    if (a.subtype === "investment") t.investments += closing;
    if (a.subtype === "fixed_asset") t.fixedAssets += closing;
    if (a.type === "asset") t.assets += closing;
    if (a.type === "liability") {
      t.liabilities += closing;
      if (a.subtype === "loan_payable") { t.loans += closing; if (a.section === "personal") t.personalLoans += closing; }
    }
    if (a.type === "income") { t.income += period; t.bySection[a.section].income += period; }
    if (a.type === "expense") { t.expense += period; t.bySection[a.section].expense += period; }
  }
  for (const s of Object.values(t.bySection)) s.profit = s.income - s.expense;
  t.available = t.cash + t.bank + t.upi;
  t.earnings = t.income - t.expense;
  t.earningsAfterLoans = t.earnings - t.personalLoans;
  t.netWorth = t.assets - t.liabilities;
  return t;
}

const inr = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 });
export const formatINR = (n: number) => (n < 0 ? "-₹" : "₹") + inr.format(Math.abs(Math.round(n * 100) / 100));

export function toCSV(rows: (string | number)[][]) {
  const esc = (v: string | number) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return "\uFEFF" + rows.map((r) => r.map(esc).join(",")).join("\r\n");
}

export function downloadCSV(name: string, rows: (string | number)[][]) {
  const blob = new Blob([toCSV(rows)], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

/** Mirrors DB account_summary: cancelled originals and their reversal entries are excluded from period AND closing (they net to zero). */
export interface LedgerEntry { date: string; reversed?: boolean; reversalOf?: boolean; lines: { account_id: string; debit: number; credit: number }[] }
export function summarizeEntries(entries: LedgerEntry[], from: string, to: string): SummaryRow[] {
  const m = new Map<string, SummaryRow>();
  for (const e of entries) {
    if (e.reversed || e.reversalOf || e.date > to) continue;
    const inPeriod = e.date >= from;
    for (const l of e.lines) {
      const r = m.get(l.account_id) ?? { account_id: l.account_id, period_debit: 0, period_credit: 0, closing_debit: 0, closing_credit: 0 };
      r.closing_debit += l.debit; r.closing_credit += l.credit;
      if (inPeriod) { r.period_debit += l.debit; r.period_credit += l.credit; }
      m.set(l.account_id, r);
    }
  }
  return [...m.values()];
}
