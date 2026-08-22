-- Waypoint Atlas — initial schema
-- Tables, indexes, RLS policies, the public share RPC, and the
-- place-images Storage bucket + policies.

-- ============================================================
-- CITIES
-- ============================================================
create table public.cities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  name text not null check (char_length(btrim(name)) > 0),
  created_at timestamptz not null default now(),
  unique (user_id, name)
);
create index cities_user_id_idx on public.cities(user_id);

alter table public.cities enable row level security;
create policy "owner_all" on public.cities
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- PLACES
-- ============================================================
create table public.places (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  city_id uuid not null references public.cities(id) on delete cascade,
  name text not null check (char_length(btrim(name)) > 0),
  maps_url text,
  address text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index places_user_city_idx on public.places(user_id, city_id);
create index places_search_idx on public.places
  using gin (to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(notes, '')));

alter table public.places enable row level security;
create policy "owner_all" on public.places
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- keep updated_at current on every edit
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
create trigger places_set_updated_at
  before update on public.places
  for each row execute function public.set_updated_at();

-- ============================================================
-- PLACE IMAGES (Supabase Storage references — never base64-in-DB)
-- ============================================================
create table public.place_images (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.places(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  storage_path text not null,   -- {user_id}/{place_id}/{uuid}.jpg
  position smallint not null default 0,
  created_at timestamptz not null default now()
);
create index place_images_place_idx on public.place_images(place_id, position);

alter table public.place_images enable row level security;
create policy "owner_all" on public.place_images
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- TAGS (normalized — supports "distinct tags with counts" and
-- multi-tag filtering without scanning free-text arrays)
-- ============================================================
create table public.tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  name text not null check (char_length(btrim(name)) > 0),
  created_at timestamptz not null default now(),
  unique (user_id, name)
);
alter table public.tags enable row level security;
create policy "owner_all" on public.tags
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.place_tags (
  place_id uuid not null references public.places(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  primary key (place_id, tag_id)
);
create index place_tags_tag_idx on public.place_tags(tag_id);

alter table public.place_tags enable row level security;
create policy "owner_all" on public.place_tags
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- TOURS
-- ============================================================
create table public.tours (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  title text not null check (char_length(btrim(title)) > 0),
  city_id uuid references public.cities(id) on delete set null, -- null = "전체 도시"
  start_date date not null,
  end_date date not null check (end_date >= start_date),
  share_enabled boolean not null default false,
  share_token text unique,
  created_at timestamptz not null default now()
);
create index tours_user_idx on public.tours(user_id);
create index tours_share_token_idx on public.tours(share_token) where share_token is not null;

alter table public.tours enable row level security;
create policy "owner_all" on public.tours
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- TOUR DAYS (day order is array order; drag-reorder = whole-array update)
-- ============================================================
create table public.tour_days (
  id uuid primary key default gen_random_uuid(),
  tour_id uuid not null references public.tours(id) on delete cascade,
  day_index smallint not null,
  date date not null,
  place_ids uuid[] not null default '{}',
  unique (tour_id, day_index)
);

alter table public.tour_days enable row level security;
create policy "owner_all" on public.tour_days
  for all using (
    exists (select 1 from public.tours t where t.id = tour_id and t.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.tours t where t.id = tour_id and t.user_id = auth.uid())
  );

-- Keep tour_days.place_ids consistent when a place is deleted (Postgres has
-- no native FK support for array columns, so this is enforced with a
-- trigger instead — mirrors the prototype's client-side deletePlace cleanup).
create or replace function public.strip_deleted_place_from_tour_days()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.tour_days
  set place_ids = array_remove(place_ids, old.id)
  where old.id = any(place_ids);
  return old;
end;
$$;
create trigger places_strip_from_tour_days
  after delete on public.places
  for each row execute function public.strip_deleted_place_from_tour_days();

-- ============================================================
-- PUBLIC SHARE RPC — the only way an anonymous viewer reaches tour data.
-- SECURITY DEFINER bypasses RLS internally, but the result is narrowed to
-- exactly one tour (the one whose token matches) with share_enabled = true,
-- and user_id is stripped from the response.
-- ============================================================
create or replace function public.get_shared_tour(p_token text)
returns jsonb
language sql security definer set search_path = public stable as $$
  select jsonb_build_object(
    'tour', to_jsonb(t) - 'user_id',
    'days', (
      select coalesce(jsonb_agg(to_jsonb(d) order by d.day_index), '[]'::jsonb)
      from public.tour_days d where d.tour_id = t.id
    ),
    'places', (
      select coalesce(jsonb_agg(to_jsonb(p) - 'user_id'), '[]'::jsonb)
      from public.places p
      where p.id = any(
        select unnest(place_ids) from public.tour_days where tour_id = t.id
      )
    ),
    'place_images', (
      select coalesce(jsonb_agg(to_jsonb(pi) - 'user_id'), '[]'::jsonb)
      from public.place_images pi
      where pi.place_id = any(
        select unnest(place_ids) from public.tour_days where tour_id = t.id
      )
    ),
    'city', (
      select to_jsonb(c) - 'user_id' from public.cities c where c.id = t.city_id
    )
  )
  from public.tours t
  where t.share_token = p_token and t.share_enabled = true;
$$;
grant execute on function public.get_shared_tour(text) to anon, authenticated;

-- ============================================================
-- STORAGE — private bucket, one folder per user
-- ============================================================
insert into storage.buckets (id, name, public)
values ('place-images', 'place-images', false)
on conflict (id) do nothing;

create policy "owner_rw" on storage.objects for all
  using (bucket_id = 'place-images' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'place-images' and (storage.foldername(name))[1] = auth.uid()::text);
