begin;
create schema if not exists tm_private;
revoke all on schema tm_private from public, anon, authenticated;

create function tm_private.valid_exclusions(value jsonb) returns boolean language sql immutable set search_path='' as $$
 select case when jsonb_typeof(value)='array' then jsonb_array_length(value)<=100 and not exists(select 1 from jsonb_array_elements(value) v where jsonb_typeof(v)<>'string' or length(v#>>'{}') not between 1 and 40) else false end;
$$;

create table public.tm_rooms (
 id uuid primary key default gen_random_uuid(),
 names jsonb not null,
 exclusions jsonb not null default '[]'::jsonb,
 revision integer not null default 0,
 created_at timestamptz not null default now(),
 check (jsonb_typeof(names)='object' and tm_private.valid_exclusions(exclusions))
);
create table public.tm_members (
 id uuid primary key default gen_random_uuid(),
 room_id uuid not null references public.tm_rooms on delete cascade,
 user_id uuid unique references auth.users on delete set null,
 slot text not null check(slot in ('a','b')),
 epoch integer not null default 0,
 unique(room_id,slot)
);
create index tm_members_room on public.tm_members(room_id);
create table public.tm_votes (
 room_id uuid not null references public.tm_rooms on delete cascade,
 member_id uuid not null references public.tm_members on delete cascade,
 dish_id text not null check(length(dish_id) between 1 and 120),
 liked boolean,
 updated_at timestamptz not null default now(),
 primary key(member_id,dish_id)
);
create index tm_votes_room on public.tm_votes(room_id);
create table public.tm_dishes (
 room_id uuid not null references public.tm_rooms on delete cascade,
 id text not null check(id ~ '^c[a-zA-Z0-9_-]{1,100}$'),
 member_id uuid not null references public.tm_members on delete cascade,
 data jsonb not null,
 photo_path text,
 primary key(room_id,id)
);
create table tm_private.tokens (
 hash text primary key,
 kind text not null check(kind in ('invite','recovery')),
 room_id uuid not null references public.tm_rooms on delete cascade,
 member_id uuid references public.tm_members on delete cascade,
 expires_at timestamptz,
 used_at timestamptz
);
create table tm_private.operations (
 member_id uuid not null references public.tm_members on delete cascade,
 operation_id uuid not null,
 result jsonb not null,
 primary key(member_id,operation_id)
);

create function tm_private.is_member(p_room uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.tm_members where room_id=p_room and user_id=(select auth.uid()));
$$;
grant usage on schema tm_private to authenticated;
grant execute on function tm_private.is_member(uuid) to authenticated;
revoke all on all tables in schema tm_private from public, anon, authenticated;

alter table tm_private.tokens enable row level security;
alter table tm_private.operations enable row level security;
alter table public.tm_rooms enable row level security;
alter table public.tm_members enable row level security;
alter table public.tm_votes enable row level security;
alter table public.tm_dishes enable row level security;
revoke all on public.tm_rooms,public.tm_members,public.tm_votes,public.tm_dishes from public,anon,authenticated;
grant select on public.tm_rooms,public.tm_members,public.tm_votes,public.tm_dishes to authenticated;
create policy room_read on public.tm_rooms for select to authenticated using(tm_private.is_member(id));
create policy member_read on public.tm_members for select to authenticated using(tm_private.is_member(room_id));
create policy vote_read on public.tm_votes for select to authenticated using(tm_private.is_member(room_id));
create policy dish_read on public.tm_dishes for select to authenticated using(tm_private.is_member(room_id));

create function public.tm_create(p_slot text,p_names jsonb,p_exclusions jsonb,p_recovery text) returns uuid
language plpgsql security definer set search_path='' as $$
declare room uuid; member uuid;
begin
 if auth.uid() is null or p_slot not in ('a','b') or p_recovery !~ '^[a-f0-9]{64}$' or p_recovery is null then raise exception 'Ungültige Anmeldung'; end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
 select room_id into room from public.tm_members where user_id=auth.uid();
 if room is not null then return room; end if;
 if length(coalesce(p_names->>'a','')) not between 1 and 24 or length(coalesce(p_names->>'b','')) not between 1 and 24 then raise exception 'Ungültige Namen'; end if;
 insert into public.tm_rooms(names,exclusions) values(jsonb_build_object('a',p_names->>'a','b',p_names->>'b'),p_exclusions) returning id into room;
 insert into public.tm_members(room_id,user_id,slot) values(room,auth.uid(),p_slot) returning id into member;
 insert into tm_private.tokens(hash,kind,room_id,member_id) values(encode(sha256(convert_to(p_recovery,'UTF8')),'hex'),'recovery',room,member);
 return room;
end $$;

create function public.tm_invite(p_token text) returns void
language plpgsql security definer set search_path='' as $$
declare m public.tm_members;
begin
 select * into m from public.tm_members where user_id=auth.uid();
 if m.id is null or p_token is null or p_token !~ '^[a-f0-9]{64}$' then raise exception 'Keine Berechtigung'; end if;
 perform 1 from public.tm_rooms where id=m.room_id for update;
 if (select count(*) from public.tm_members where room_id=m.room_id)>=2 then raise exception 'Beide Plätze sind bereits belegt'; end if;
 update tm_private.tokens set used_at=now() where room_id=m.room_id and kind='invite' and used_at is null;
 insert into tm_private.tokens(hash,kind,room_id,expires_at) values(encode(sha256(convert_to(p_token,'UTF8')),'hex'),'invite',m.room_id,now()+interval '24 hours');
end $$;

create function public.tm_join(p_token text,p_recovery text) returns uuid
language plpgsql security definer set search_path='' as $$
declare t tm_private.tokens; member uuid; target text;
begin
 if auth.uid() is null or p_token is null or p_token !~ '^[a-f0-9]{64}$' or p_recovery is null or p_recovery !~ '^[a-f0-9]{64}$' then raise exception 'Einladung ungültig'; end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
 if exists(select 1 from public.tm_members where user_id=auth.uid()) then raise exception 'Dieses Gerät ist schon verbunden'; end if;
 select * into t from tm_private.tokens where hash=encode(sha256(convert_to(p_token,'UTF8')),'hex') and kind='invite';
 if t.room_id is null then raise exception 'Einladung ungültig oder abgelaufen'; end if;
 perform 1 from public.tm_rooms where id=t.room_id for update;
 select * into t from tm_private.tokens where hash=t.hash for update;
 if t.used_at is not null or t.expires_at<=now() then raise exception 'Einladung ungültig oder abgelaufen'; end if;
 if (select count(*) from public.tm_members where room_id=t.room_id)>=2 then raise exception 'Beide Plätze sind bereits belegt'; end if;
 select case when slot='a' then 'b' else 'a' end into target from public.tm_members where room_id=t.room_id;
 insert into public.tm_members(room_id,user_id,slot) values(t.room_id,auth.uid(),target) returning id into member;
 update tm_private.tokens set used_at=now() where hash=t.hash;
 insert into tm_private.tokens(hash,kind,room_id,member_id) values(encode(sha256(convert_to(p_recovery,'UTF8')),'hex'),'recovery',t.room_id,member);
 return t.room_id;
end $$;

create function public.tm_recovery(p_token text) returns void
language plpgsql security definer set search_path='' as $$
declare m public.tm_members;
begin
 select * into m from public.tm_members where user_id=auth.uid() for update;
 if m.id is null or p_token is null or p_token !~ '^[a-f0-9]{64}$' then raise exception 'Keine Berechtigung'; end if;
 delete from tm_private.tokens where member_id=m.id and kind='recovery';
 insert into tm_private.tokens(hash,kind,room_id,member_id) values(encode(sha256(convert_to(p_token,'UTF8')),'hex'),'recovery',m.room_id,m.id);
end $$;

create function public.tm_restore(p_token text,p_recovery text) returns uuid
language plpgsql security definer set search_path='' as $$
declare t tm_private.tokens;
begin
 if auth.uid() is null or p_token is null or p_token !~ '^[a-f0-9]{64}$' or p_recovery is null or p_recovery !~ '^[a-f0-9]{64}$' then raise exception 'Code ungültig'; end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
 if exists(select 1 from public.tm_members where user_id=auth.uid()) then raise exception 'Dieses Gerät ist schon verbunden'; end if;
 select * into t from tm_private.tokens where hash=encode(sha256(convert_to(p_token,'UTF8')),'hex') and kind='recovery' and used_at is null for update;
 if t.member_id is null then raise exception 'Code ungültig oder bereits verwendet'; end if;
 update public.tm_members set user_id=auth.uid(),epoch=epoch+1 where id=t.member_id;
 delete from tm_private.tokens where member_id=t.member_id and kind='recovery';
 insert into tm_private.tokens(hash,kind,room_id,member_id) values(encode(sha256(convert_to(p_recovery,'UTF8')),'hex'),'recovery',t.room_id,t.member_id);
 return t.room_id;
end $$;

create function public.tm_apply(p_operation uuid,p_kind text,p_epoch integer,p_payload jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare m public.tm_members; r jsonb; d jsonb; path text; old public.tm_dishes; v_revision integer;
begin
 select * into m from public.tm_members where user_id=auth.uid() for update;
 if m.id is null then raise exception 'Gerätezugriff nicht mehr gültig'; end if;
 select result into r from tm_private.operations where member_id=m.id and operation_id=p_operation;
 if r is not null then return r; end if;
 if p_kind in ('vote','import_vote','reset') and p_epoch is distinct from m.epoch then return jsonb_build_object('stale',true,'epoch',m.epoch); end if;
 r:='{}'::jsonb;
 if p_kind in ('vote','import_vote') then
   if length(coalesce(p_payload->>'dish','')) not between 1 and 120 or coalesce(jsonb_typeof(p_payload->'liked'),'null') not in ('boolean','null') then raise exception 'Ungültige Bewertung'; end if;
   if p_kind='import_vote' then
     insert into public.tm_votes(room_id,member_id,dish_id,liked) values(m.room_id,m.id,p_payload->>'dish',(p_payload->>'liked')::boolean) on conflict do nothing;
   else
     insert into public.tm_votes(room_id,member_id,dish_id,liked) values(m.room_id,m.id,p_payload->>'dish',(p_payload->>'liked')::boolean)
     on conflict(member_id,dish_id) do update set liked=excluded.liked,updated_at=now();
   end if;
 elsif p_kind='reset' then
   update public.tm_members set epoch=epoch+1 where id=m.id returning epoch into m.epoch;
   delete from public.tm_votes where member_id=m.id;
   r:=jsonb_build_object('epoch',m.epoch);
 elsif p_kind='settings' then
   select tm_rooms.revision into v_revision from public.tm_rooms where id=m.room_id for update;
   if v_revision is distinct from (p_payload->>'revision')::integer then return jsonb_build_object('conflict',true); end if;
   if p_payload ? 'names' and (length(coalesce(p_payload->'names'->>'a','')) not between 1 and 24 or length(coalesce(p_payload->'names'->>'b','')) not between 1 and 24) then raise exception 'Ungültige Namen'; end if;
   if p_payload ? 'exclusions' and not tm_private.valid_exclusions(p_payload->'exclusions') then raise exception 'Ungültige Zutatenliste'; end if;
   update public.tm_rooms set names=coalesce(p_payload->'names',names),exclusions=coalesce(p_payload->'exclusions',exclusions),revision=tm_rooms.revision+1 where id=m.room_id;
 elsif p_kind='dish' then
   d:=p_payload->'dish';path:=p_payload->>'photo_path';
   if jsonb_typeof(d)<>'object' or not (d ?& array['id','name','desc','cuisine','time','shape','base','tops','veg','ing']) or jsonb_typeof(d->'veg')<>'boolean' or jsonb_typeof(d->'ing')<>'array' or jsonb_array_length(d->'ing')>40 or exists(select 1 from jsonb_array_elements(d->'ing') v where jsonb_typeof(v)<>'string' or length(v#>>'{}')>60) or d->>'id' is null or d->>'id' !~ '^c[a-zA-Z0-9_-]{1,100}$' or length(coalesce(d->>'name','')) not between 1 and 40 or length(coalesce(d->>'desc',''))>100 or length(coalesce(d->>'cuisine',''))>24 or (d->>'time')::integer not between 5 and 600 or d->>'shape' not in ('plate','bowl','pan') or d->>'base' !~ '^#[0-9a-fA-F]{6}$' or jsonb_typeof(d->'tops')<>'array' or jsonb_array_length(d->'tops')>8 or exists(select 1 from jsonb_array_elements_text(d->'tops') color where color !~ '^#[0-9a-fA-F]{6}$') then raise exception 'Ungültiges Gericht'; end if;
   if path is not null and path<>m.room_id::text||'/'||m.id::text||'/'||(d->>'id')||'.jpg' then raise exception 'Ungültiger Fotopfad'; end if;
   select * into old from public.tm_dishes where room_id=m.room_id and id=d->>'id';
   if old.id is not null and old.member_id<>m.id then raise exception 'Dieses Gericht gehört der anderen Person'; end if;
   insert into public.tm_dishes(room_id,id,member_id,data,photo_path) values(m.room_id,d->>'id',m.id,d-'photo'-'photo_path',path)
   on conflict(room_id,id) do nothing;
 else raise exception 'Unbekannte Änderung';
 end if;
 insert into tm_private.operations(member_id,operation_id,result) values(m.id,p_operation,r);
 return r;
end $$;

create function public.tm_snapshot() returns jsonb
language sql stable security definer set search_path='' as $$
 select jsonb_build_object('room',to_jsonb(r),'me',jsonb_build_object('id',m.id,'slot',m.slot,'epoch',m.epoch),
 'members',(select coalesce(jsonb_agg(jsonb_build_object('id',id,'slot',slot,'epoch',epoch)),'[]') from public.tm_members where room_id=r.id),
 'votes',(select coalesce(jsonb_agg(to_jsonb(v)),'[]') from public.tm_votes v where room_id=r.id),
 'dishes',(select coalesce(jsonb_agg(to_jsonb(d)),'[]') from public.tm_dishes d where room_id=r.id))
 from public.tm_members m join public.tm_rooms r on r.id=m.room_id where m.user_id=auth.uid();
$$;

-- Functions are the only write interface. No administrative key is needed in the browser.
revoke execute on function tm_private.is_member(uuid) from public,anon;
revoke all on function public.tm_create(text,jsonb,jsonb,text),public.tm_invite(text),public.tm_join(text,text),public.tm_recovery(text),public.tm_restore(text,text),public.tm_apply(uuid,text,integer,jsonb),public.tm_snapshot() from public,anon;
grant execute on function public.tm_create(text,jsonb,jsonb,text),public.tm_invite(text),public.tm_join(text,text),public.tm_recovery(text),public.tm_restore(text,text),public.tm_apply(uuid,text,integer,jsonb),public.tm_snapshot() to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('tm-photos','tm-photos',false,2097152,array['image/jpeg']) on conflict(id) do nothing;
create policy tm_photo_read on storage.objects for select to authenticated using(bucket_id='tm-photos' and (storage.foldername(name))[1] in (select room_id::text from public.tm_members where user_id=(select auth.uid())));
create policy tm_photo_insert on storage.objects for insert to authenticated with check(bucket_id='tm-photos' and exists(select 1 from public.tm_members where user_id=(select auth.uid()) and room_id::text=(storage.foldername(name))[1] and id::text=(storage.foldername(name))[2]) and array_length(storage.foldername(name),1)=2 and storage.extension(name)='jpg');
create policy tm_photo_update on storage.objects for update to authenticated using(bucket_id='tm-photos' and exists(select 1 from public.tm_members where user_id=(select auth.uid()) and room_id::text=(storage.foldername(name))[1] and id::text=(storage.foldername(name))[2])) with check(bucket_id='tm-photos' and exists(select 1 from public.tm_members where user_id=(select auth.uid()) and room_id::text=(storage.foldername(name))[1] and id::text=(storage.foldername(name))[2]) and array_length(storage.foldername(name),1)=2 and storage.extension(name)='jpg');

alter publication supabase_realtime add table public.tm_rooms,public.tm_members,public.tm_votes,public.tm_dishes;
commit;
