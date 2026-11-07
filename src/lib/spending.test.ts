import { describe, it, expect } from "vitest";
import { computeTotals, spendingByCategory, summarizeEntries, type Account, type LedgerEntry } from "./accounting";

const acc = (id: string, subtype: Account["subtype"], type: Account["type"], section: Account["section"] = "personal"): Account =>
  ({ id, name: id, subtype, type, section, party: null, interest_rate: null, is_archived: false });
const accounts = [
  acc("upi", "upi", "asset"), acc("loan", "loan_payable", "liability"), acc("inv", "investment", "asset"),
  acc("salary", "income", "income"), acc("food", "expense", "expense", "household"), acc("rent", "expense", "expense", "ghar"), acc("int", "expense", "expense"),
];
const D = "2026-10-15";
const post = (dr: string, cr: string, amt: number): LedgerEntry =>
  ({ date: D, lines: [{ account_id: dr, debit: amt, credit: 0 }, { account_id: cr, debit: 0, credit: amt }] });
const spend = (es: LedgerEntry[]) => spendingByCategory(accounts, computeTotals(accounts, summarizeEntries(es, "2026-10-01", "2026-10-31")));

describe("spending by category (પૈસા ક્યાં ગયા)", () => {
  it("lists expense categories largest-first with shares of total expense", () => {
    const rows = spend([post("upi", "salary", 50000), post("food", "upi", 6000), post("rent", "upi", 4000)]);
    expect(rows.map((r) => r.account.id)).toEqual(["food", "rent"]);
    expect(rows[0]!.amount).toBe(6000);
    expect(rows[0]!.share).toBeCloseTo(0.6);
    expect(rows[1]!.share).toBeCloseTo(0.4);
  });
  it("transfers, loan principal and investments are not spending", () => {
    const rows = spend([
      post("upi", "salary", 50000), post("food", "upi", 2000),
      post("upi", "loan", 10000), post("loan", "upi", 3000), // loan taken + principal repaid
      post("inv", "upi", 5000),                               // investment
    ]);
    expect(rows.map((r) => r.account.id)).toEqual(["food"]);
    expect(rows[0]!.share).toBe(1);
  });
  it("interest paid counts as spending", () => {
    const rows = spend([post("upi", "loan", 10000), post("int", "upi", 500)]);
    expect(rows.map((r) => r.account.id)).toEqual(["int"]);
    expect(rows[0]!.amount).toBe(500);
  });
  it("no expense in period gives an empty list", () => {
    expect(spend([post("upi", "salary", 50000)])).toEqual([]);
  });
});
