CREATE OR REPLACE FUNCTION public.record_transaction(p_kind text, p_date date, p_amount numeric, p_debit uuid, p_credit uuid, p_description text DEFAULT NULL::text, p_party text DEFAULT NULL::text, p_section book_section DEFAULT 'personal'::book_section, p_idempotency_key text DEFAULT NULL::text, p_extra_amount numeric DEFAULT 0, p_extra_account uuid DEFAULT NULL::uuid)
 RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
declare uid uuid := auth.uid(); r record; d record; c record; x record; eid uuid; ex numeric := coalesce(p_extra_amount,0);
begin
  if uid is null then raise exception 'not authenticated'; end if;
  if ex < 0 then raise exception 'વ્યાજ ઋણ ન હોઈ શકે'; end if;
  if p_amount is null or p_amount < 0 then raise exception 'રકમ શૂન્યથી વધુ હોવી જોઈએ'; end if;
  if p_amount = 0 and not (ex > 0 and p_kind in ('loan_repay','lend_collect','invest_redeem')) then
    raise exception 'રકમ શૂન્યથી વધુ હોવી જોઈએ';
  end if;
  if p_debit = p_credit then raise exception 'બંને ખાતા અલગ હોવા જોઈએ'; end if;
  if p_date is null or p_date > current_date + 1 then raise exception 'અમાન્ય તારીખ'; end if;
  select * into r from kind_rule(p_kind);
  if r.dr is null then raise exception 'અમાન્ય વ્યવહાર પ્રકાર'; end if;
  select * into d from accounts where id = p_debit and user_id = uid;
  select * into c from accounts where id = p_credit and user_id = uid;
  if d.id is null or c.id is null then raise exception 'ખાતું મળ્યું નહીં'; end if;
  if not (d.subtype = any(r.dr)) or not (c.subtype = any(r.cr)) then
    raise exception 'આ વ્યવહાર માટે ખાતાનો પ્રકાર યોગ્ય નથી';
  end if;
  if p_idempotency_key is not null then
    select id into eid from journal_entries where user_id = uid and idempotency_key = p_idempotency_key;
    if eid is not null then return eid; end if;
  end if;

  insert into journal_entries(user_id, entry_date, kind, section, description, party, amount, idempotency_key)
  values (uid, p_date, p_kind, coalesce(p_section,'personal'), nullif(trim(p_description),''), nullif(trim(p_party),''), p_amount + ex, p_idempotency_key)
  returning id into eid;

  if p_amount > 0 then
    insert into journal_lines(entry_id, user_id, account_id, debit, credit) values
      (eid, uid, p_debit, p_amount, 0), (eid, uid, p_credit, 0, p_amount);
  end if;

  if ex > 0 then
    if p_kind not in ('loan_repay','lend_collect','invest_redeem') then raise exception 'વ્યાજ આ વ્યવહારમાં માન્ય નથી'; end if;
    select * into x from accounts where id = p_extra_account and user_id = uid;
    if x.id is null then raise exception 'વ્યાજ ખાતું પસંદ કરો'; end if;
    if p_kind = 'loan_repay' then
      if x.subtype <> 'expense' then raise exception 'વ્યાજ ખર્ચ ખાતું પસંદ કરો'; end if;
      insert into journal_lines(entry_id,user_id,account_id,debit,credit) values (eid,uid,x.id,ex,0),(eid,uid,p_credit,0,ex);
    else
      if x.subtype <> 'income' then raise exception 'આવક ખાતું પસંદ કરો'; end if;
      insert into journal_lines(entry_id,user_id,account_id,debit,credit) values (eid,uid,p_debit,ex,0),(eid,uid,x.id,0,ex);
    end if;
  end if;

  if (select sum(debit) - sum(credit) from journal_lines where entry_id = eid) <> 0 then
    raise exception 'unbalanced entry';
  end if;
  insert into audit_logs(user_id, action, entity, entity_id, details)
  values (uid, 'create', 'journal_entry', eid, jsonb_build_object('kind',p_kind,'amount',p_amount,'extra',ex));
  return eid;
end $function$;