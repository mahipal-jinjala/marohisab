import { describe, it, expect } from "vitest";
import { computeTotals, summarizeEntries, type Account, type LedgerEntry } from "./accounting";

const acc = (id: string, subtype: Account["subtype"], type: Account["type"]): Account =>
  ({ id, name: id, subtype, type, section: "personal", party: null, interest_rate: null, is_archived: false });
const accounts = [acc("upi", "upi", "asset"), acc("salary", "income", "income"), acc("other", "income", "income"), acc("grocery", "expense", "expense")];
const D = "2026-10-15";
const post = (dr: string, cr: string, amt: number, x: Partial<LedgerEntry> = {}): LedgerEntry =>
  ({ date: D, lines: [{ account_id: dr, debit: amt, credit: 0 }, { account_id: cr, debit: 0, credit: amt }], ...x });
// reversal of a posting = swapped lines, flagged
const rev = (e: LedgerEntry, date = D): LedgerEntry => ({ date, reversalOf: true, lines: e.lines.map((l) => ({ ...l, debit: l.credit, credit: l.debit })) });
const totals = (es: LedgerEntry[], from = "2026-10-01", to = "2026-10-31") => computeTotals(accounts, summarizeEntries(es, from, to));

describe("income create / edit / cancel / reverse", () => {
  const salary = post("upi", "salary", 50000);
  const grocery = post("grocery", "upi", 20000);

  it("create income counts once", () => {
    const t = totals([salary, post("upi", "other", 1500)]);
    expect(t.income).toBe(51500); expect(t.upi).toBe(51500);
  });
  it("edit = reversal + repost, no double count", () => {
    const orig = post("upi", "other", 1000, { reversed: true });
    const t = totals([salary, grocery, orig, rev(orig), post("upi", "other", 1500)]);
    expect(t.income).toBe(51500); expect(t.expense).toBe(20000);
    expect(t.earnings).toBe(31500); expect(t.upi).toBe(31500);
  });
  it("cancelled income excluded from totals and balances", () => {
    const orig = post("upi", "other", 10000, { reversed: true });
    const t = totals([salary, orig, rev(orig)]);
    expect(t.income).toBe(50000); expect(t.upi).toBe(50000);
  });
  it("reversal dated later does not distort an earlier closing balance", () => {
    const orig = post("upi", "other", 10000, { reversed: true, date: "2026-09-10" });
    const t = totals([orig, rev(orig, "2026-10-15")], "2026-09-01", "2026-09-30");
    expect(t.upi).toBe(0); expect(t.income).toBe(0);
  });
  it("cash/UPI balance equals net of active income minus expense", () => {
    const t = totals([salary, grocery, post("upi", "other", 1500)]);
    expect(t.upi).toBe(t.earnings);
  });
});
