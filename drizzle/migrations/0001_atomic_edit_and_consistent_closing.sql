CREATE OR REPLACE FUNCTION public.account_summary(p_from date, p_to date)
 RETURNS TABLE(account_id uuid, period_debit numeric, period_credit numeric, closing_debit numeric, closing_credit numeric)
 LANGUAGE sql STABLE SET search_path TO 'public'
AS $$
  select a.id,
    coalesce(sum(l.debit) filter (where e.entry_date between p_from and p_to and e.reversal_of is null and e.reversed_by is null),0),
    coalesce(sum(l.credit) filter (where e.entry_date between p_from and p_to and e.reversal_of is null and e.reversed_by is null),0),
    coalesce(sum(l.debit) filter (where e.entry_date <= p_to and e.reversal_of is null and e.reversed_by is null),0),
    coalesce(sum(l.credit) filter (where e.entry_date <= p_to and e.reversal_of is null and e.reversed_by is null),0)
  from accounts a
  left join journal_lines l on l.account_id = a.id
  left join journal_entries e on e.id = l.entry_id
  where a.user_id = auth.uid()
  group by a.id
$$;

CREATE OR REPLACE FUNCTION public.edit_transaction(p_entry uuid, p_kind text, p_date date, p_amount numeric, p_debit uuid, p_credit uuid, p_description text DEFAULT NULL, p_party text DEFAULT NULL, p_section book_section DEFAULT 'personal', p_idempotency_key text DEFAULT NULL, p_extra_amount numeric DEFAULT 0, p_extra_account uuid DEFAULT NULL)
 RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
declare uid uuid := auth.uid(); e record; nid uuid;
begin
  if uid is null then raise exception 'not authenticated'; end if;
  if p_idempotency_key is not null then
    select id into nid from journal_entries where user_id = uid and idempotency_key = p_idempotency_key;
    if nid is not null then return nid; end if;
  end if;
  select * into e from journal_entries where id = p_entry and user_id = uid for update;
  if e.id is null then raise exception 'વ્યવહાર મળ્યો નહીં'; end if;
  if e.reversed_by is not null or e.reversal_of is not null then raise exception 'આ વ્યવહાર પહેલેથી રદ થયેલ છે'; end if;
  if e.kind <> p_kind then raise exception 'અમાન્ય વ્યવહાર પ્રકાર'; end if;
  perform reverse_transaction(p_entry, 'edit');
  nid := record_transaction(p_kind, p_date, p_amount, p_debit, p_credit, p_description, p_party, p_section, p_idempotency_key, p_extra_amount, p_extra_account);
  insert into audit_logs(user_id, action, entity, entity_id, details)
  values (uid, 'edit', 'journal_entry', p_entry, jsonb_build_object('replacement', nid));
  return nid;
end $$;

REVOKE ALL ON FUNCTION public.edit_transaction(uuid,text,date,numeric,uuid,uuid,text,text,book_section,text,numeric,uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.edit_transaction(uuid,text,date,numeric,uuid,uuid,text,text,book_section,text,numeric,uuid) TO authenticated;