import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Account } from "@/lib/accounting";
import { TxnDialog } from "./TxnDialog";

const state = vi.hoisted(() => ({ accounts: [] as Account[], save: vi.fn() }));
vi.mock("@/lib/data", () => ({
  useAccounts: () => ({ data: state.accounts }),
  useRecord: () => ({ mutateAsync: state.save, isPending: false }),
  todayISO: () => "2026-11-03",
  errMsg: () => "Save failed",
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn() } }));

const account = (id: string, subtype: Account["subtype"]): Account => ({
  id, name: id, subtype, type: subtype === "loan_payable" ? "liability" : "asset",
  section: "personal", party: null, interest_rate: null, is_archived: false,
});
const submit = () => {
  fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "10000" } });
  fireEvent.click(screen.getByRole("button", { name: "સાચવો" }));
};

beforeEach(() => {
  state.accounts = [account("upi", "upi"), account("loan", "loan_payable")];
  state.save.mockReset().mockResolvedValue("entry");
});
afterEach(cleanup);

describe("Transaction account selection", () => {
  it("posts automatic receiving and loan accounts without manual selection, including reopening", async () => {
    const onClose = vi.fn();
    const view = render(<TxnDialog preset={{ kind: "loan_taken" }} onClose={onClose} />);
    view.rerender(<TxnDialog preset={null} onClose={onClose} />);
    view.rerender(<TxnDialog preset={{ kind: "loan_taken" }} onClose={onClose} />);
    submit();
    await waitFor(() => expect(state.save).toHaveBeenCalledOnce());
    expect(state.save.mock.calls[0][0].input).toMatchObject({ debit: "upi", credit: "loan", amount: 10000 });
    expect(screen.queryByText("બંને ખાતા પસંદ કરો")).not.toBeInTheDocument();
  });

  it("uses defaults when eligible accounts arrive after the form opens", async () => {
    state.accounts = [];
    const view = render(<TxnDialog preset={{ kind: "loan_taken" }} onClose={vi.fn()} />);
    state.accounts = [account("upi", "upi"), account("loan", "loan_payable")];
    view.rerender(<TxnDialog preset={{ kind: "loan_taken" }} onClose={vi.fn()} />);
    submit();
    await waitFor(() => expect(state.save).toHaveBeenCalledOnce());
    expect(state.save.mock.calls[0][0].input).toMatchObject({ debit: "upi", credit: "loan" });
  });

  it.each(["receiving", "loan", "archived", "wrong subtype"])("rejects a missing or invalid %s account", (missing) => {
    if (missing === "receiving") state.accounts = [account("loan", "loan_payable")];
    if (missing === "loan") state.accounts = [account("upi", "upi")];
    if (missing === "archived") state.accounts[1].is_archived = true;
    if (missing === "wrong subtype") state.accounts[1] = account("loan", "bank");
    render(<TxnDialog preset={{ kind: "loan_taken" }} onClose={vi.fn()} />);
    submit();
    expect(screen.getByText("બંને ખાતા પસંદ કરો")).toBeInTheDocument();
    expect(state.save).not.toHaveBeenCalled();
  });

  it("posts the actual From and To accounts for a transfer", async () => {
    state.accounts = [account("upi", "upi"), account("bank", "bank")];
    render(<TxnDialog preset={{ kind: "transfer" }} onClose={vi.fn()} />);
    const selects = screen.getAllByRole("combobox");
    fireEvent.change(selects[2], { target: { value: "bank" } });
    submit();
    await waitFor(() => expect(state.save).toHaveBeenCalledOnce());
    expect(state.save.mock.calls[0][0].input).toMatchObject({ debit: "bank", credit: "upi" });
  });

  it("still rejects the same account on both sides", () => {
    state.accounts = [account("upi", "upi")];
    render(<TxnDialog preset={{ kind: "transfer" }} onClose={vi.fn()} />);
    submit();
    expect(screen.getByText("બંને ખાતા અલગ હોવા જોઈએ")).toBeInTheDocument();
    expect(state.save).not.toHaveBeenCalled();
  });
});