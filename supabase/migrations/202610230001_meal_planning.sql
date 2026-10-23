begin;
-- Existing rooms, member ids, votes and photo paths remain untouched.
create table public.mp_records (
 room_id uuid not null references public.tm_rooms on delete cascade,
 kind text not null check(kind in ('goal','profile','meal','recipe')),
 id text not null check(length(id) between 1 and 120),
 owner_id uuid not null references public.tm_members on delete cascade,
 data jsonb not null check(jsonb_typeof(data)='object' and octet_length(data::text)<=200000),
 revision integer not null default 1,
 deleted boolean not null default false,
 updated_at timestamptz not null default now(),
 primary key(room_id,kind,id)
);
alter table public.mp_records enable row level security;
revoke all on public.mp_records from anon,authenticated;
grant select on public.mp_records to authenticated;
create policy mp_read on public.mp_records for select to authenticated using (
 exists(select 1 from public.tm_members m where m.user_id=(select auth.uid()) and m.room_id=mp_records.room_id
 and (mp_records.kind<>'profile' or mp_records.owner_id=m.id))
);
create function public.mp_snapshot() returns jsonb
language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(to_jsonb(r)),'[]'::jsonb) from public.mp_records r
 join public.tm_members m on m.room_id=r.room_id and m.user_id=auth.uid()
 where r.kind<>'profile' or r.owner_id=m.id;
$$;
create function public.mp_apply(p_operation uuid,p_kind text,p_id text,p_expected integer,p_data jsonb,p_deleted boolean default false) returns jsonb
language plpgsql security definer set search_path='' as $$
declare m public.tm_members; old public.mp_records; result jsonb;
begin
 select * into m from public.tm_members where user_id=auth.uid() for update;
 if m.id is null then raise exception 'Gerätezugriff nicht mehr gültig'; end if;
 select o.result into result from tm_private.operations o where o.member_id=m.id and o.operation_id=p_operation;
 if result is not null then return result; end if;
 if p_kind is null or p_kind not in ('goal','profile','meal','recipe') or p_id is null or length(p_id) not between 1 and 120
 or p_expected is null or p_expected<0 or p_data is null or jsonb_typeof(p_data)<>'object' or octet_length(p_data::text)>200000 or p_deleted is null then raise exception 'Ungültige Planänderung'; end if;
 if p_kind in ('goal','profile') and p_id<>m.id::text then raise exception 'Nur eigene persönliche Einstellungen können geändert werden'; end if;
 if p_kind='goal' and (p_data->>'kcal' is null or (p_data->>'kcal')::numeric not between 500 and 10000) then raise exception 'Kalorienziel muss zwischen 500 und 10000 liegen'; end if;
 if p_kind='meal' and not p_deleted and (length(coalesce(p_data->>'name','')) not between 1 and 120 or p_data->>'day' not in ('Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag','Sonntag') or not (p_data ? 'day') or jsonb_typeof(p_data->'ingredients') is distinct from 'array' or jsonb_array_length(p_data->'ingredients')>80) then raise exception 'Ungültige Mahlzeit'; end if;
 if p_kind in ('meal','recipe') and not p_deleted and exists(select 1 from jsonb_array_elements(coalesce(p_data->'ingredients','[]')) i where jsonb_typeof(i) is distinct from 'object' or i->>'grams' is null or (i->>'grams')::numeric<0 or (i->>'grams')::numeric>100000) then raise exception 'Ungültige Zutatenmengen'; end if;
 perform pg_advisory_xact_lock(hashtextextended(m.room_id::text||p_kind||p_id,0));
 select * into old from public.mp_records where room_id=m.room_id and kind=p_kind and id=p_id for update;
 if coalesce(old.revision,0)<>p_expected or old.deleted is true then
   result:=jsonb_build_object('conflict',true,'revision',coalesce(old.revision,0));
 else
   insert into public.mp_records(room_id,kind,id,owner_id,data,revision,deleted) values(m.room_id,p_kind,p_id,m.id,p_data,1,p_deleted)
   on conflict(room_id,kind,id) do update set data=excluded.data,revision=mp_records.revision+1,deleted=excluded.deleted,updated_at=now();
   result:=jsonb_build_object('revision',p_expected+1);
 end if;
 insert into tm_private.operations(member_id,operation_id,result) values(m.id,p_operation,result);
 return result;
end $$;
revoke all on function public.mp_snapshot(),public.mp_apply(uuid,text,text,integer,jsonb,boolean) from public,anon;
grant execute on function public.mp_snapshot(),public.mp_apply(uuid,text,text,integer,jsonb,boolean) to authenticated;
alter publication supabase_realtime add table public.mp_records;
commit;
