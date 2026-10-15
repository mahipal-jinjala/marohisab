import { describe, it, expect } from "vitest";
import { buildLines, isBalanced, computeTotals, formatINR, type Account, type SummaryRow } from "./accounting";

const acc = (id: string, subtype: Account["subtype"], type: Account["type"], section: Account["section"] = "personal"): Account =>
  ({ id, name: id, subtype, type, section, party: null, interest_rate: null, is_archived: false });

const accounts = [
  acc("cash", "cash", "asset"), acc("bank", "bank", "asset"), acc("loan", "loan_payable", "liability"),
  acc("recv", "receivable", "asset"), acc("inv", "investment", "asset"), acc("sal", "income", "income"),
  acc("food", "expense", "expense", "household"), acc("int", "expense", "expense"),
  acc("milk", "income", "income", "dairy"), acc("feed", "expense", "expense", "dairy"), acc("cap", "equity", "equity"),
];
// Accumulate journal lines into summary rows (all within period).
function run(entries: { dr: string; cr: string; amt: number }[]): SummaryRow[] {
  const m = new Map<string, SummaryRow>();
  const get = (id: string) => m.get(id) ?? (m.set(id, { account_id: id, period_debit: 0, period_credit: 0, closing_debit: 0, closing_credit: 0 }), m.get(id)!);
  for (const e of entries) {
    const d = get(e.dr); d.period_debit += e.amt; d.closing_debit += e.amt;
    const c = get(e.cr); c.period_credit += e.amt; c.closing_credit += e.amt;
  }
  return [...m.values()];
}

describe("accounting rules", () => {
  it("loan received is a liability, not income", () => {
    const t = computeTotals(accounts, run([{ dr: "cash", cr: "loan", amt: 100000 }]));
    expect(t.income).toBe(0);
    expect(t.loans).toBe(100000);
    expect(t.available).toBe(100000);
    expect(t.netWorth).toBe(0);
  });
  it("loan principal repayment is not an expense; interest is", () => {
    const t = computeTotals(accounts, run([
      { dr: "cash", cr: "loan", amt: 100000 },
      { dr: "loan", cr: "cash", amt: 40000 },
      { dr: "int", cr: "cash", amt: 2000 },
    ]));
    expect(t.expense).toBe(2000);
    expect(t.loans).toBe(60000);
    expect(t.available).toBe(58000);
  });
  it("money lent is a receivable, not an expense", () => {
    const t = computeTotals(accounts, run([{ dr: "cash", cr: "cap", amt: 50000 }, { dr: "recv", cr: "cash", amt: 20000 }]));
    expect(t.expense).toBe(0);
    expect(t.receivables).toBe(20000);
    expect(t.netWorth).toBe(50000);
  });
  it("investment transfer is not an expense", () => {
    const t = computeTotals(accounts, run([{ dr: "bank", cr: "cap", amt: 80000 }, { dr: "inv", cr: "bank", amt: 30000 }]));
    expect(t.expense).toBe(0);
    expect(t.investments).toBe(30000);
    expect(t.netWorth).toBe(80000);
  });
  it("dairy profit = milk sales - dairy expenses; earnings after loans", () => {
    const t = computeTotals(accounts, run([
      { dr: "cash", cr: "milk", amt: 30000 }, { dr: "feed", cr: "cash", amt: 12000 },
      { dr: "food", cr: "cash", amt: 5000 }, { dr: "cash", cr: "loan", amt: 10000 },
    ]));
    expect(t.bySection.dairy.profit).toBe(18000);
    expect(t.earnings).toBe(13000);
    expect(t.earningsAfterLoans).toBe(3000);
  });
  it("journal lines are balanced, including interest", () => {
    expect(isBalanced(buildLines("loan_repay", 1000, "loan_payable", "cash", 120, "expense"))).toBe(true);
    expect(isBalanced(buildLines("lend_collect", 500, "cash", "receivable", 50, "income"))).toBe(true);
  });
  it("rejects wrong account types (e.g. loan as income)", () => {
    expect(() => buildLines("income", 100, "cash", "loan_payable")).toThrow();
    expect(() => buildLines("expense", 0, "expense", "cash")).toThrow();
    expect(() => buildLines("income", 100, "cash", "income", 10, "income")).toThrow();
  });
  it("formats INR in Indian grouping", () => {
    expect(formatINR(100000)).toBe("₹1,00,000");
    expect(formatINR(-1234567.5)).toBe("-₹12,34,567.5");
  });
});
