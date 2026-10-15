
create type public.account_type as enum ('asset','liability','equity','income','expense');
create type public.account_subtype as enum ('cash','bank','upi','receivable','investment','fixed_asset','loan_payable','other_liability','equity','income','expense');
create type public.book_section as enum ('personal','household','ghar','dairy','business');

create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  name text not null check (length(trim(name)) between 1 and 80),
  type public.account_type not null,
  subtype public.account_subtype not null,
  section public.book_section not null default 'personal',
  party text,
  interest_rate numeric(6,2),
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, section, subtype, name)
);
create index accounts_user_idx on public.accounts(user_id);

create table public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  entry_date date not null,
  kind text not null,
  section public.book_section not null default 'personal',
  description text,
  party text,
  amount numeric(14,2) not null check (amount > 0),
  reversal_of uuid references public.journal_entries(id),
  reversed_by uuid references public.journal_entries(id),
  idempotency_key text,
  created_at timestamptz not null default now(),
  unique (user_id, idempotency_key)
);
create index je_user_date_idx on public.journal_entries(user_id, entry_date desc);

create table public.journal_lines (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.journal_entries(id) on delete restrict,
  user_id uuid not null,
  account_id uuid not null references public.accounts(id) on delete restrict,
  debit numeric(14,2) not null default 0 check (debit >= 0),
  credit numeric(14,2) not null default 0 check (credit >= 0),
  check ((debit > 0) <> (credit > 0))
);
create index jl_entry_idx on public.journal_lines(entry_id);
create index jl_account_idx on public.journal_lines(account_id);
create index jl_user_idx on public.journal_lines(user_id);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  action text not null,
  entity text not null,
  entity_id uuid,
  details jsonb,
  created_at timestamptz not null default now()
);
create index audit_user_idx on public.audit_logs(user_id, created_at desc);

grant select, insert, update on public.accounts to authenticated;
grant select on public.journal_entries, public.journal_lines, public.audit_logs to authenticated;
grant all on public.accounts, public.journal_entries, public.journal_lines, public.audit_logs to service_role;

alter table public.accounts enable row level security;
alter table public.journal_entries enable row level security;
alter table public.journal_lines enable row level security;
alter table public.audit_logs enable row level security;

create policy "own accounts select" on public.accounts for select to authenticated using (user_id = auth.uid());
create policy "own accounts insert" on public.accounts for insert to authenticated with check (user_id = auth.uid());
create policy "own accounts update" on public.accounts for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own entries select" on public.journal_entries for select to authenticated using (user_id = auth.uid());
create policy "own lines select" on public.journal_lines for select to authenticated using (user_id = auth.uid());
create policy "own audit select" on public.audit_logs for select to authenticated using (user_id = auth.uid());

-- prevent changing type/subtype of accounts once used
create or replace function public.guard_account_update() returns trigger language plpgsql set search_path = public as $$
begin
  if (new.type <> old.type or new.subtype <> old.subtype or new.user_id <> old.user_id)
     and exists (select 1 from journal_lines where account_id = old.id) then
    raise exception 'ઉપયોગમાં લેવાયેલ ખાતાનો પ્રકાર બદલી શકાય નહીં';
  end if;
  return new;
end $$;
create trigger accounts_guard before update on public.accounts for each row execute function public.guard_account_update();

create or replace function public.subtype_type(s public.account_subtype) returns public.account_type language sql immutable as $$
  select case s
    when 'cash' then 'asset' when 'bank' then 'asset' when 'upi' then 'asset'
    when 'receivable' then 'asset' when 'investment' then 'asset' when 'fixed_asset' then 'asset'
    when 'loan_payable' then 'liability' when 'other_liability' then 'liability'
    when 'equity' then 'equity' when 'income' then 'income' else 'expense' end::public.account_type
$$;

create or replace function public.accounts_set_type() returns trigger language plpgsql set search_path = public as $$
begin new.type := public.subtype_type(new.subtype); return new; end $$;
create trigger accounts_type before insert or update on public.accounts for each row execute function public.accounts_set_type();

-- default chart of accounts
create or replace function public.ensure_default_accounts() returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not authenticated'; end if;
  if exists (select 1 from accounts where user_id = uid) then return; end if;
  insert into accounts(user_id, name, type, subtype, section) values
   (uid,'રોકડ','asset','cash','personal'),
   (uid,'બેંક ખાતું','asset','bank','personal'),
   (uid,'UPI વોલેટ','asset','upi','personal'),
   (uid,'શરૂઆતની મૂડી','equity','equity','personal'),
   (uid,'પગાર','income','income','personal'),
   (uid,'અન્ય આવક','income','income','personal'),
   (uid,'વ્યાજ આવક','income','income','personal'),
   (uid,'રોકાણ નફો','income','income','personal'),
   (uid,'વ્યાજ ખર્ચ','expense','expense','personal'),
   (uid,'અન્ય ખર્ચ','expense','expense','personal'),
   (uid,'કરિયાણું','expense','expense','household'),
   (uid,'વીજળી બિલ','expense','expense','household'),
   (uid,'શિક્ષણ','expense','expense','household'),
   (uid,'દવા','expense','expense','household'),
   (uid,'ઘર સમારકામ','expense','expense','ghar'),
   (uid,'ઘર વેરો','expense','expense','ghar'),
   (uid,'દૂધ વેચાણ','income','income','dairy'),
   (uid,'ભેંસ વેચાણ','income','income','dairy'),
   (uid,'ઘાસચારો / દાણ','expense','expense','dairy'),
   (uid,'પશુ દવા / ડૉક્ટર','expense','expense','dairy'),
   (uid,'મજૂરી','expense','expense','dairy'),
   (uid,'ભેંસો','asset','fixed_asset','dairy'),
   (uid,'તબેલો (શેડ)','asset','fixed_asset','dairy'),
   (uid,'સાધનો','asset','fixed_asset','dairy'),
   (uid,'FD','asset','investment','personal'),
   (uid,'RD','asset','investment','personal'),
   (uid,'શેર','asset','investment','personal'),
   (uid,'મ્યુચ્યુઅલ ફંડ','asset','investment','personal'),
   (uid,'સોનું','asset','investment','personal');
end $$;

-- allowed debit/credit subtypes per kind
create or replace function public.kind_rule(p_kind text, out dr public.account_subtype[], out cr public.account_subtype[])
language sql immutable as $$
  select case p_kind
    when 'income' then '{cash,bank,upi}'::public.account_subtype[]
    when 'expense' then '{expense}'
    when 'transfer' then '{cash,bank,upi}'
    when 'loan_taken' then '{cash,bank,upi}'
    when 'loan_repay' then '{loan_payable,other_liability}'
    when 'lend' then '{receivable}'
    when 'lend_collect' then '{cash,bank,upi}'
    when 'invest' then '{investment}'
    when 'invest_redeem' then '{cash,bank,upi}'
    when 'asset_buy' then '{fixed_asset}'
    when 'asset_sell' then '{cash,bank,upi}'
    when 'opening_asset' then '{cash,bank,upi,receivable,investment,fixed_asset}'
    when 'opening_liability' then '{equity}'
  end,
  case p_kind
    when 'income' then '{income}'::public.account_subtype[]
    when 'expense' then '{cash,bank,upi,loan_payable,other_liability}'
    when 'transfer' then '{cash,bank,upi}'
    when 'loan_taken' then '{loan_payable,other_liability}'
    when 'loan_repay' then '{cash,bank,upi}'
    when 'lend' then '{cash,bank,upi}'
    when 'lend_collect' then '{receivable}'
    when 'invest' then '{cash,bank,upi}'
    when 'invest_redeem' then '{investment}'
    when 'asset_buy' then '{cash,bank,upi,loan_payable,other_liability}'
    when 'asset_sell' then '{fixed_asset}'
    when 'opening_asset' then '{equity}'
    when 'opening_liability' then '{loan_payable,other_liability}'
  end
$$;

create or replace function public.record_transaction(
  p_kind text, p_date date, p_amount numeric, p_debit uuid, p_credit uuid,
  p_description text default null, p_party text default null, p_section public.book_section default 'personal',
  p_idempotency_key text default null, p_extra_amount numeric default 0, p_extra_account uuid default null
) returns uuid language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); r record; d record; c record; x record; eid uuid; money uuid;
begin
  if uid is null then raise exception 'not authenticated'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'રકમ શૂન્યથી વધુ હોવી જોઈએ'; end if;
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
  values (uid, p_date, p_kind, coalesce(p_section,'personal'), nullif(trim(p_description),''), nullif(trim(p_party),''), p_amount + coalesce(p_extra_amount,0), p_idempotency_key)
  returning id into eid;

  insert into journal_lines(entry_id, user_id, account_id, debit, credit) values
    (eid, uid, p_debit, p_amount, 0), (eid, uid, p_credit, 0, p_amount);

  -- interest / gain portion recorded separately
  if coalesce(p_extra_amount,0) > 0 then
    if p_kind not in ('loan_repay','lend_collect','invest_redeem') then raise exception 'વ્યાજ આ વ્યવહારમાં માન્ય નથી'; end if;
    select * into x from accounts where id = p_extra_account and user_id = uid;
    if x.id is null then raise exception 'વ્યાજ ખાતું પસંદ કરો'; end if;
    if p_kind = 'loan_repay' then
      if x.subtype <> 'expense' then raise exception 'વ્યાજ ખર્ચ ખાતું પસંદ કરો'; end if;
      insert into journal_lines(entry_id,user_id,account_id,debit,credit) values (eid,uid,x.id,p_extra_amount,0),(eid,uid,p_credit,0,p_extra_amount);
    else
      if x.subtype <> 'income' then raise exception 'આવક ખાતું પસંદ કરો'; end if;
      insert into journal_lines(entry_id,user_id,account_id,debit,credit) values (eid,uid,p_debit,p_extra_amount,0),(eid,uid,x.id,0,p_extra_amount);
    end if;
  elsif coalesce(p_extra_amount,0) < 0 then raise exception 'વ્યાજ ઋણ ન હોઈ શકે';
  end if;

  if (select sum(debit) - sum(credit) from journal_lines where entry_id = eid) <> 0 then
    raise exception 'unbalanced entry';
  end if;
  insert into audit_logs(user_id, action, entity, entity_id, details)
  values (uid, 'create', 'journal_entry', eid, jsonb_build_object('kind',p_kind,'amount',p_amount,'extra',p_extra_amount));
  return eid;
end $$;

create or replace function public.reverse_transaction(p_entry uuid, p_reason text default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); e record; rid uuid;
begin
  if uid is null then raise exception 'not authenticated'; end if;
  select * into e from journal_entries where id = p_entry and user_id = uid for update;
  if e.id is null then raise exception 'વ્યવહાર મળ્યો નહીં'; end if;
  if e.reversed_by is not null or e.reversal_of is not null then raise exception 'આ વ્યવહાર પહેલેથી રદ થયેલ છે'; end if;
  insert into journal_entries(user_id, entry_date, kind, section, description, party, amount, reversal_of)
  values (uid, current_date, e.kind, e.section, 'રદ: ' || coalesce(e.description, e.kind), e.party, e.amount, e.id)
  returning id into rid;
  insert into journal_lines(entry_id, user_id, account_id, debit, credit)
  select rid, uid, account_id, credit, debit from journal_lines where entry_id = e.id;
  update journal_entries set reversed_by = rid where id = e.id;
  insert into audit_logs(user_id, action, entity, entity_id, details)
  values (uid, 'reverse', 'journal_entry', e.id, jsonb_build_object('reversal', rid, 'reason', p_reason));
  return rid;
end $$;

-- balances: period movement + closing balance per account
create or replace function public.account_summary(p_from date, p_to date)
returns table(account_id uuid, period_debit numeric, period_credit numeric, closing_debit numeric, closing_credit numeric)
language sql stable security invoker set search_path = public as $$
  select a.id,
    coalesce(sum(l.debit) filter (where e.entry_date between p_from and p_to and e.reversal_of is null and e.reversed_by is null),0),
    coalesce(sum(l.credit) filter (where e.entry_date between p_from and p_to and e.reversal_of is null and e.reversed_by is null),0),
    coalesce(sum(l.debit) filter (where e.entry_date <= p_to),0),
    coalesce(sum(l.credit) filter (where e.entry_date <= p_to),0)
  from accounts a
  left join journal_lines l on l.account_id = a.id
  left join journal_entries e on e.id = l.entry_id
  where a.user_id = auth.uid()
  group by a.id
$$;

revoke all on function public.record_transaction, public.reverse_transaction, public.ensure_default_accounts, public.account_summary from public, anon;
grant execute on function public.record_transaction, public.reverse_transaction, public.ensure_default_accounts, public.account_summary to authenticated;
