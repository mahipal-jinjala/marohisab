<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Ledger writes go only through SECURITY DEFINER RPCs (record_transaction, reverse_transaction); the browser has SELECT-only on journal tables so balances can't be manipulated client-side.
- Edits/deletes are reversals, never row updates/deletes — keeps an audit trail and balanced books.
- Allowed debit/credit account subtypes per transaction kind live in both the DB `kind_rule` and `src/lib/accounting.ts` KINDS; keep them in sync.
